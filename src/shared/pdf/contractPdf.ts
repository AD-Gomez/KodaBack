import PDFDocument from 'pdfkit';
import axios from 'axios';
import sharp from 'sharp';

import { logger } from '../logger.js';
import { getObjectBuffer, getObjectKey } from '../storage/s3Storage.js';
import { decodeHtmlEntities } from '../utils/sanitizeRichText.js';

export interface CedulaPdfInput {
  contractId: string;
  contractTitulo: string;
  departamentoNombre: string;
  departamentoDireccion: string;
  arrendatarioNombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  fechaFirmado: Date;
  nombreLegal: string;
  firmaDataUrl: string;
  firmasCapturadas?: Array<{
    nombre: string;
    rol: 'ABOGADA' | 'ARRENDADOR' | 'ARRENDATARIO' | 'FIRMANTE';
    firmaDataUrl: string;
    fechaFirmado?: Date | null;
  }>;
  cedulaFrenteUrl?: string | null;
  cedulaReversoUrl?: string | null;
  contenido?: string | null;
  ipFirmado?: string | null;
  userAgent?: string | null;
  version: number;
}

function renderSignature(
  doc: PDFKit.PDFDocument,
  signature: NonNullable<CedulaPdfInput['firmasCapturadas']>[number],
  x: number,
  y: number,
  width: number,
) {
  const signatureHeight = 100;
  const signatureBuffer = parseDataUrl(signature.firmaDataUrl);

  const signatureY = y;
  doc
    .save()
    .lineWidth(1)
    .strokeColor('#cbd5e1')
    .rect(x, signatureY, width, signatureHeight)
    .stroke()
    .restore();

  if (signatureBuffer) {
    try {
      doc.image(signatureBuffer, x + 6, signatureY + 6, {
        fit: [width - 12, signatureHeight - 12],
        align: 'center',
        valign: 'center',
      });
    } catch (err) {
      logger.warn({ err, nombre: signature.nombre }, 'No se pudo incrustar una firma en el PDF');
    }
  }

  if (signature.fechaFirmado) {
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text(
        `Firmado: ${formatDateTime(signature.fechaFirmado)}`,
        x,
        signatureY + signatureHeight + 60,
        {
          width,
          align: 'center',
        },
      );
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#0f172a')
    .text(signature.rol, x, signatureY + signatureHeight + 9, { width, align: 'center' });
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#475569')
    .text(signature.nombre, x, signatureY + signatureHeight + 24, { width, align: 'center' });
}

function renderAttorneySignature(
  doc: PDFKit.PDFDocument,
  signature: NonNullable<CedulaPdfInput['firmasCapturadas']>[number],
  x: number,
  y: number,
  width: number,
) {
  const signatureBuffer = parseDataUrl(signature.firmaDataUrl);
  if (!signatureBuffer) return;

  try {
    // En el documento de referencia la rúbrica de la abogada encabeza el
    // contrato sin recuadro; su nombre, cargo e IPSA forman parte del contenido.
    doc.image(signatureBuffer, x, y, {
      fit: [width, 82],
      valign: 'center',
    });
  } catch (err) {
    logger.warn({ err, nombre: signature.nombre }, 'No se pudo incrustar la firma de la abogada');
  }
}

async function fetchAsPngBuffer(reference: string): Promise<Buffer | null> {
  try {
    const raw = getObjectKey(reference)
      ? await getObjectBuffer(reference)
      : Buffer.from(
          (
            await axios.get<ArrayBuffer>(reference, {
              responseType: 'arraybuffer',
              timeout: 15_000,
            })
          ).data,
        );
    return sharp(raw).rotate().png().toBuffer();
  } catch (err) {
    logger.warn({ err, reference }, 'No se pudo descargar la imagen para el PDF');
    return null;
  }
}

function parseDataUrl(dataUrl: string): Buffer | null {
  const match = /^data:image\/[a-zA-Z+]+;base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return Buffer.from(match[1]!, 'base64');
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type InlineFormat = { bold: boolean; italic: boolean; underline: boolean };

const DEFAULT_FORMAT: InlineFormat = { bold: false, italic: false, underline: false };

const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'blockquote']);
const HEADING_TAGS = new Set(['h1', 'h2', 'h3']);
// La vista previa pública utiliza Poppins a 13 px. Helvetica es la fuente
// sans-serif integrada de PDFKit más cercana y evita que la vista y el PDF
// parezcan documentos distintos.
const CONTRACT_BODY_FONT = 'Helvetica';
const CONTRACT_BOLD_FONT = 'Helvetica-Bold';
const CONTRACT_ITALIC_FONT = 'Helvetica-Oblique';
const CONTRACT_BOLD_ITALIC_FONT = 'Helvetica-BoldOblique';

function chooseContractFont(format: InlineFormat): string {
  if (format.bold && format.italic) return CONTRACT_BOLD_ITALIC_FONT;
  if (format.bold) return CONTRACT_BOLD_FONT;
  if (format.italic) return CONTRACT_ITALIC_FONT;
  return CONTRACT_BODY_FONT;
}

const CLAUSE_ORDINALS =
  'PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|SEPTIMA|OCTAVA|NOVENA|DÉCIMA|DECIMA|UNDÉCIMA|UNDECIMA|DUODÉCIMA|DUODECIMA';

function formatPlainContractContent(value: string): string {
  let formatted = value.replace(/\s+/g, ' ').trim();
  if (!formatted) return '';

  const clauseWithSubject = new RegExp(
    `(^|[\\s:;])(?:\\d+\\s*[:.)-]?\\s*)?(${CLAUSE_ORDINALS})\\s*:\\s*([^\\n.]{2,48})\\.-\\s*`,
    'giu',
  );
  const clauseWithoutSubject = new RegExp(
    `(^|[\\s:;])(?:\\d+\\s*[:.)-]?\\s*)?(${CLAUSE_ORDINALS})\\s*:\\s*`,
    'giu',
  );

  formatted = formatted.replace(
    clauseWithSubject,
    (_match, prefix: string, ordinal: string, subject: string) => {
      return `${prefix}</p><h3>CLÁUSULA ${ordinal.toUpperCase()} · ${subject.trim().toUpperCase()}</h3><p>`;
    },
  );
  formatted = formatted.replace(clauseWithoutSubject, (_match, prefix: string, ordinal: string) => {
    return `${prefix}</p><h3>CLÁUSULA ${ordinal.toUpperCase()}</h3><p>`;
  });

  formatted = formatted.replace(
    /(Los bienes muebles(?:\s+siguientes)?\s*:\s*)([\s\S]*?)(?=<\/p>|$)/iu,
    (_match, introduction: string, rawItems: string) => {
      const items = rawItems
        .trim()
        .split(/,\s*(?=(?:(?:un|una|dos|tres|cuatro|cinco)\s*\(\d+\)|\(\d+\)\s*[A-Za-zÁÉÍÓÚÑ]))/iu)
        .map((item) => item.trim())
        .filter(Boolean);

      if (items.length < 2) return `${introduction}${rawItems}`;
      return `${introduction}</p><ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
    },
  );

  formatted = formatted.replace(
    /\b(EL\s+ARRENDADOR|EL\s+ARRENDATARIO|LAS\s+PARTES|CONTRATO\s+DE\s+ARRENDAMIENTO|CANON\s+DE\s+ARRENDAMIENTO)\b/giu,
    '<strong>$1</strong>',
  );

  return `<p>${formatted}</p>`;
}

function renderContractContent(doc: PDFKit.PDFDocument, html: string) {
  // En el navegador los saltos que vienen dentro del texto (por ejemplo, al
  // pegar un contrato desde Word) se colapsan como espacios. Solo <br> y los
  // elementos de bloque deben forzar una línea nueva. Si convertimos cada
  // salto de origen en una línea del PDF, queda una columna angosta y mucho
  // espacio vacío a la derecha.
  const source = decodeHtmlEntities(html).replace(/\s*[\r\n]+\s*/g, ' ');
  const text = /<\/?[a-z][^>]*>/i.test(source) ? source : formatPlainContractContent(source);
  const tagPattern = /<\s*(\/?)\s*([a-z0-9]+)(?:\s[^>]*)?>/gi;
  const tagStack: string[] = [];
  let buffer = '';
  let listIndex = 0;

  const inList = (): 'ul' | 'ol' | null => {
    for (let i = tagStack.length - 1; i >= 0; i--) {
      const tag = tagStack[i];
      if (tag === 'ul' || tag === 'ol') return tag;
      if (BLOCK_TAGS.has(tag ?? '')) return null;
    }
    return null;
  };

  const flushParagraph = (blockTag: string | null) => {
    const trimmed = buffer
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim();
    buffer = '';
    if (!trimmed) return;

    const headingTag = blockTag && HEADING_TAGS.has(blockTag) ? blockTag : null;
    // Equivalente a la vista previa: 13 px (≈10 pt) y line-height 1.75.
    const baseSize =
      headingTag === 'h1' ? 14 : headingTag === 'h2' ? 12 : headingTag === 'h3' ? 10.5 : 10;
    const lineGap = headingTag ? 3 : 7;
    const isBlockquote = blockTag === 'blockquote';
    const listType = inList();

    if (headingTag) doc.moveDown(0.4);
    else if (isBlockquote) doc.moveDown(0.2);
    else if (blockTag) doc.moveDown(0.25);

    let indent = doc.page.margins.left;
    let widthOffset = 0;
    if (isBlockquote) {
      indent += 18;
      widthOffset = -18;
    }

    if (listType) {
      listIndex += 1;
      const marker = listType === 'ol' ? `${listIndex}.` : '•';
      doc
        .font(CONTRACT_BODY_FONT)
        .fontSize(baseSize)
        .fillColor('#1e293b')
        .text(marker, indent, doc.y, { continued: true, width: 12, lineGap });
      indent += 14;
    }

    const lines = trimmed.split('\n');
    lines.forEach((line) => {
      if (!line) {
        doc.moveDown(0.3);
        return;
      }
      const segments = parseInlineSegments(line);
      // Es normal recibir marcas vacías, como <b><br></b>, desde el editor.
      // No son texto y jamás deben aparecer impresas como "<b>".
      if (segments.length === 0) return;
      for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
        const segment = segments[segmentIndex]!;
        const options = {
          continued: segmentIndex < segments.length - 1,
          width: doc.page.width - doc.page.margins.right - indent + widthOffset,
          underline: segment.format.underline,
          lineGap,
        };
        doc
          .font(headingTag ? CONTRACT_BOLD_FONT : chooseContractFont(segment.format))
          .fontSize(baseSize)
          .fillColor(headingTag ? '#0f172a' : isBlockquote ? '#475569' : '#1e293b');
        if (segmentIndex === 0) doc.text(segment.text, indent, doc.y, options);
        else doc.text(segment.text, options);
      }
    });

    doc.moveDown(0.5);
  };

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  tagPattern.lastIndex = 0;
  while ((match = tagPattern.exec(text)) !== null) {
    const matchStart = match.index;
    const between = text.slice(lastIndex, matchStart);
    if (between) buffer += between;
    const closing = match[1] === '/';
    const rawTag = (match[2] ?? '').toLowerCase();
    lastIndex = tagPattern.lastIndex;

    if (rawTag === 'br') {
      buffer += '\n';
      continue;
    }

    if (BLOCK_TAGS.has(rawTag) || rawTag === 'li' || rawTag === 'div') {
      if (!closing) {
        const activeBlock = tagStack[tagStack.length - 1] ?? null;
        flushParagraph(activeBlock);

        if (rawTag === 'ul' || rawTag === 'ol') {
          listIndex = 0;
          tagStack.push(rawTag);
        } else {
          tagStack.push(rawTag);
        }
      } else {
        const top = tagStack[tagStack.length - 1];
        if (top === rawTag) {
          flushParagraph(rawTag);
          tagStack.pop();
        }
      }
      continue;
    }

    if (rawTag === 'strong' || rawTag === 'b') {
      buffer += closing ? `</${rawTag}>` : `<${rawTag}>`;
      continue;
    }
    if (rawTag === 'em' || rawTag === 'i') {
      buffer += closing ? `</${rawTag}>` : `<${rawTag}>`;
      continue;
    }
    if (rawTag === 'u') {
      buffer += closing ? `</${rawTag}>` : `<${rawTag}>`;
      continue;
    }
  }

  const tail = text.slice(lastIndex);
  if (tail) buffer += tail;
  flushParagraph(tagStack[tagStack.length - 1] ?? null);
}

export function parseInlineSegments(line: string): Array<{ text: string; format: InlineFormat }> {
  const segments: Array<{ text: string; format: InlineFormat }> = [];
  const tagPattern = /<\s*(\/?)\s*([a-z0-9]+)(?:\s[^>]*)?>/gi;
  const formatStack: InlineFormat[] = [DEFAULT_FORMAT];
  let buffer = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const currentFormat = (): InlineFormat => formatStack[formatStack.length - 1] ?? DEFAULT_FORMAT;

  const flush = () => {
    if (buffer) {
      segments.push({ text: buffer, format: { ...currentFormat() } });
      buffer = '';
    }
  };

  while ((match = tagPattern.exec(line)) !== null) {
    const between = line.slice(lastIndex, match.index);
    if (between) buffer += between;
    const closing = match[1] === '/';
    const tag = (match[2] ?? '').toLowerCase();
    lastIndex = tagPattern.lastIndex;

    if (tag === 'br') {
      buffer += '\n';
      continue;
    }
    if (tag === 'strong' || tag === 'b') {
      flush();
      if (!closing) formatStack.push({ ...currentFormat(), bold: true });
      else if (formatStack.length > 1) formatStack.pop();
      continue;
    }
    if (tag === 'em' || tag === 'i') {
      flush();
      if (!closing) formatStack.push({ ...currentFormat(), italic: true });
      else if (formatStack.length > 1) formatStack.pop();
      continue;
    }
    if (tag === 'u') {
      flush();
      if (!closing) formatStack.push({ ...currentFormat(), underline: true });
      else if (formatStack.length > 1) formatStack.pop();
      continue;
    }
    // Block tags shouldn't appear inline, but skip them defensively
    flush();
    if (!closing) formatStack.push({ ...currentFormat() });
    else formatStack.pop();
  }

  const tail = line.slice(lastIndex);
  if (tail) buffer += tail;
  flush();

  return segments;
}

export async function buildSignedContractPdf(input: CedulaPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: {
      Title: input.contractTitulo || 'Contrato de arrendamiento',
      Author: 'KodaHouse',
      Subject: 'Contrato firmado electrónicamente',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk as Buffer));

  const firmasCapturadas = input.firmasCapturadas?.filter((firma) => firma.firmaDataUrl) ?? [];
  const signatures = (
    firmasCapturadas.length
      ? firmasCapturadas
      : [
          {
            nombre: input.nombreLegal,
            rol: 'FIRMANTE' as const,
            firmaDataUrl: input.firmaDataUrl,
            fechaFirmado: input.fechaFirmado,
          },
        ]
  )
    .slice()
    .sort((a, b) => {
      const order = { ABOGADA: 0, ARRENDADOR: 1, ARRENDATARIO: 2, FIRMANTE: 3 } as const;
      return order[a.rol] - order[b.rol];
    });
  const firmaAbogada = signatures.find((signature) => signature.rol === 'ABOGADA');
  const firmasPartes = signatures.filter((signature) => signature.rol !== 'ABOGADA');
  const signatureWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right - 24) / 2;

  // Como en el contrato de referencia, la firma de la abogada encabeza el documento.
  if (firmaAbogada) {
    const attorneyY = doc.y;
    const attorneyX = doc.page.margins.left;
    renderAttorneySignature(doc, firmaAbogada, attorneyX, attorneyY, signatureWidth);
    doc.y = attorneyY + 96;
  }

  // --- Texto del contrato aceptado ---
  if (input.contenido && input.contenido.trim()) {
    renderContractContent(doc, input.contenido);
    doc.moveDown(0.5);
  }

  // --- Página final de firmas ---
  doc.addPage();
  doc.fontSize(18).fillColor('#0f172a').font('Helvetica-Bold').text('Firmas del contrato');
  doc.moveDown(0.35);
  doc
    .fontSize(10)
    .fillColor('#475569')
    .font('Helvetica')
    .text('Firmas electrónicas capturadas de las partes del contrato.', { align: 'left' });
  doc.moveDown(1.2);

  const signatureY = doc.y;
  for (let i = 0; i < firmasPartes.length; i++) {
    const signature = firmasPartes[i]!;
    const column = i % 2;
    const row = Math.floor(i / 2);
    const x = doc.page.margins.left + column * (signatureWidth + 24);
    const y = signatureY + row * 195;
    renderSignature(doc, signature, x, y, signatureWidth);
  }

  // --- Página independiente de cédula ---
  doc.addPage();
  doc.fontSize(18).fillColor('#0f172a').font('Helvetica-Bold').text('Documento de identidad');
  doc.moveDown(0.35);
  doc
    .fontSize(10)
    .fillColor('#475569')
    .font('Helvetica')
    .text(`Fotografías de la cédula de ${input.nombreLegal}.`, { align: 'left' });
  doc.moveDown(1);

  const cedulaImgs: Array<{ url: string; label: string }> = [];
  if (input.cedulaFrenteUrl)
    cedulaImgs.push({ url: input.cedulaFrenteUrl, label: 'Cédula · Frente' });
  if (input.cedulaReversoUrl)
    cedulaImgs.push({ url: input.cedulaReversoUrl, label: 'Cédula · Reverso' });

  if (cedulaImgs.length === 0) {
    doc.fillColor('#94a3b8').font('Helvetica-Oblique').text('Sin fotografías cargadas.');
  } else {
    const imgW = (doc.page.width - doc.page.margins.left - doc.page.margins.right - 16) / 2;
    const imgH = 250;
    const cedulaStartY = doc.y;
    for (let i = 0; i < cedulaImgs.length; i++) {
      const slot = cedulaImgs[i]!;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = doc.page.margins.left + col * (imgW + 16);
      const y = cedulaStartY + row * (imgH + 28);
      const png = await fetchAsPngBuffer(slot.url);
      if (png) {
        try {
          doc.image(png, x, y, {
            width: imgW,
            height: imgH,
            fit: [imgW, imgH],
            align: 'center',
            valign: 'center',
          });
        } catch (err) {
          logger.warn({ err, url: slot.url }, 'No se pudo incrustar la imagen de cédula en el PDF');
        }
      } else {
        doc.save().lineWidth(1).strokeColor('#cbd5e1').rect(x, y, imgW, imgH).stroke().restore();
        doc
          .fillColor('#94a3b8')
          .fontSize(10)
          .text('Imagen no disponible', x + 8, y + imgH / 2 - 6, { width: imgW - 16 });
      }
      doc
        .fontSize(9)
        .fillColor('#64748b')
        .text(slot.label, x, y + imgH + 4, { width: imgW, align: 'center' });
    }
    doc.y = cedulaStartY + Math.ceil(cedulaImgs.length / 2) * (imgH + 28);
  }

  // --- Footer ---
  doc.moveDown(2);
  doc
    .strokeColor('#e2e8f0')
    .lineWidth(0.8)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.4);
  doc
    .fontSize(8)
    .fillColor('#94a3b8')
    .font('Helvetica')
    .text(
      'Este documento fue generado electrónicamente por KodaHouse. La firma capturada tiene validez legal conforme a la legislación aplicable.',
      { align: 'center' },
    );

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}
