import PDFDocument from 'pdfkit';
import axios from 'axios';
import sharp from 'sharp';

import { logger } from '../logger.js';
import { getObjectBuffer, getObjectKey } from '../storage/s3Storage.js';

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
  cedulaFrenteUrl?: string | null;
  cedulaReversoUrl?: string | null;
  contenido?: string | null;
  ipFirmado?: string | null;
  userAgent?: string | null;
  version: number;
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

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_m, code: string) => {
      const n = Number(code);
      return Number.isFinite(n) ? String.fromCharCode(n) : '';
    });
}

function chooseFont(format: InlineFormat, boldFont: string, italicFont: string): string {
  if (format.bold && format.italic) return 'Helvetica-BoldOblique';
  if (format.bold) return boldFont;
  if (format.italic) return italicFont;
  return 'Helvetica';
}

function renderContractContent(doc: PDFKit.PDFDocument, html: string) {
  const text = decodeEntities(html).replace(/\r\n/g, '\n');
  const tagPattern = /<\s*(\/?)\s*([a-z0-9]+)(?:\s[^>]*)?>/gi;
  const tagStack: string[] = [];
  const formatStack: InlineFormat[] = [DEFAULT_FORMAT];
  let buffer = '';
  let listIndex = 0;

  const currentFormat = (): InlineFormat => formatStack[formatStack.length - 1] ?? DEFAULT_FORMAT;
  const inList = (): 'ul' | 'ol' | null => {
    for (let i = tagStack.length - 1; i >= 0; i--) {
      const tag = tagStack[i];
      if (tag === 'ul' || tag === 'ol') return tag;
      if (BLOCK_TAGS.has(tag ?? '')) return null;
    }
    return null;
  };

  const flushParagraph = (blockTag: string | null) => {
    const trimmed = buffer.replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
    buffer = '';
    if (!trimmed) return;

    const headingTag = blockTag && HEADING_TAGS.has(blockTag) ? blockTag : null;
    const baseSize = headingTag === 'h1' ? 16 : headingTag === 'h2' ? 14 : headingTag === 'h3' ? 12 : 11;
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
        .font('Helvetica')
        .fontSize(baseSize)
        .fillColor('#1e293b')
        .text(marker, indent, doc.y, { continued: true, width: 12 });
      indent += 14;
    }

    const lines = trimmed.split('\n');
    lines.forEach((line, lineIdx) => {
      if (!line) {
        doc.moveDown(0.3);
        return;
      }
      const segments = parseInlineSegments(line);
      const isLastLine = lineIdx === lines.length - 1;
      let first = true;
      for (const segment of segments) {
        const font = chooseFont(
          segment.format,
          headingTag ? 'Helvetica-Bold' : 'Helvetica-Bold',
          'Helvetica-Oblique',
        );
        doc
          .font(font)
          .fontSize(baseSize)
          .fillColor(isBlockquote ? '#475569' : '#1e293b');
        doc.text(segment.text, indent, doc.y, {
          continued: !first || !isLastLine || segments.length > 1,
          width: doc.page.width - doc.page.margins.right - indent + widthOffset,
          underline: segment.format.underline,
        });
        first = false;
      }
    });

    doc.moveDown(0.4);
  };

  const flushListItem = () => {
    flushParagraph('li');
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
        if (rawTag === 'ul' || rawTag === 'ol') {
          listIndex = 0;
          flushParagraph('p');
          tagStack.push(rawTag);
        } else if (rawTag === 'li') {
          flushListItem();
          tagStack.push('li');
        } else {
          const top = tagStack[tagStack.length - 1];
          if (top === 'li') {
            tagStack.pop();
            flushListItem();
          }
          if (rawTag === 'p' && buffer.trim() === '') continue;
          flushParagraph(rawTag);
          tagStack.push(rawTag);
        }
      } else {
        const top = tagStack[tagStack.length - 1];
        if (top === rawTag) {
          if (rawTag === 'li') {
            tagStack.pop();
            flushListItem();
          } else {
            tagStack.pop();
          }
        }
      }
      continue;
    }

    if (rawTag === 'strong' || rawTag === 'b') {
      if (closing) {
        const idx = formatStack.lastIndexOf({ ...formatStack[formatStack.length - 1]!, bold: true });
        if (idx > 0) formatStack.splice(idx, 1);
      } else {
        formatStack.push({ ...currentFormat(), bold: true });
      }
      continue;
    }
    if (rawTag === 'em' || rawTag === 'i') {
      if (closing) {
        const idx = formatStack.lastIndexOf({ ...formatStack[formatStack.length - 1]!, italic: true });
        if (idx > 0) formatStack.splice(idx, 1);
      } else {
        formatStack.push({ ...currentFormat(), italic: true });
      }
      continue;
    }
    if (rawTag === 'u') {
      if (closing) {
        const idx = formatStack.lastIndexOf({ ...formatStack[formatStack.length - 1]!, underline: true });
        if (idx > 0) formatStack.splice(idx, 1);
      } else {
        formatStack.push({ ...currentFormat(), underline: true });
      }
      continue;
    }
  }

  const tail = text.slice(lastIndex);
  if (tail) buffer += tail;
  flushParagraph(null);
}

function parseInlineSegments(line: string): Array<{ text: string; format: InlineFormat }> {
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
      else formatStack.pop();
      continue;
    }
    if (tag === 'em' || tag === 'i') {
      flush();
      if (!closing) formatStack.push({ ...currentFormat(), italic: true });
      else formatStack.pop();
      continue;
    }
    if (tag === 'u') {
      flush();
      if (!closing) formatStack.push({ ...currentFormat(), underline: true });
      else formatStack.pop();
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

  if (segments.length === 0) {
    segments.push({ text: line, format: { ...DEFAULT_FORMAT } });
  }
  return segments;
}

export async function buildSignedContractPdf(input: CedulaPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: {
      Title: input.contractTitulo || 'Contrato de arrendamiento',
      Author: 'KodaHouse',
      Subject: 'Contrato firmado electrónicamente',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk as Buffer));

  // --- Encabezado ---
  doc.fillColor('#0f172a').fontSize(20).font('Helvetica-Bold').text('KodaHouse', { align: 'left' });
  doc
    .fontSize(9)
    .fillColor('#64748b')
    .font('Helvetica')
    .text('Contrato firmado electrónicamente', { align: 'left' });
  doc.moveDown(0.6);
  doc
    .strokeColor('#e2e8f0')
    .lineWidth(0.8)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(1);

  // --- Datos del contrato ---
  doc.fontSize(14).fillColor('#0f172a').font('Helvetica-Bold').text('Datos del contrato');
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor('#1e293b').font('Helvetica');

  const labelFont = 'Helvetica-Bold';
  const valueFont = 'Helvetica';
  const lineHeight = 16;
  const startY = doc.y;
  const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2;

  function pair(label: string, value: string, row: number, col: 0 | 1) {
    const x = doc.page.margins.left + col * colWidth;
    const y = startY + row * lineHeight * 2.2;
    doc
      .font(labelFont)
      .fontSize(9)
      .fillColor('#64748b')
      .text(label.toUpperCase(), x, y, { width: colWidth - 8 });
    doc
      .font(valueFont)
      .fontSize(11)
      .fillColor('#0f172a')
      .text(value || '—', x, y + 12, { width: colWidth - 8 });
  }

  pair('Título', input.contractTitulo || `Contrato de arrendamiento`, 0, 0);
  pair('Versión', `v${input.version}`, 0, 1);
  pair('Propiedad', input.departamentoNombre, 1, 0);
  pair('Dirección', input.departamentoDireccion, 1, 1);
  pair('Arrendatario', input.arrendatarioNombre, 2, 0);
  pair('ID interno', input.contractId.slice(0, 8).toUpperCase(), 2, 1);
  pair('Fecha de inicio', formatDate(input.fechaInicio), 3, 0);
  pair('Fecha de fin', formatDate(input.fechaFin), 3, 1);

  doc.y = startY + 4 * lineHeight * 2.2 + 6;
  doc.moveDown(1);

  // --- Texto del contrato aceptado ---
  if (input.contenido && input.contenido.trim()) {
    doc.fontSize(14).fillColor('#0f172a').font('Helvetica-Bold').text('Contrato aceptado');
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#64748b').font('Helvetica').text(
      'A continuación se reproduce el contenido íntegro del contrato que el firmante declara aceptar al firmar:',
    );
    doc.moveDown(0.4);
    renderContractContent(doc, input.contenido);
    doc.moveDown(0.5);
  }

  // --- Bloque de firma ---
  doc.fontSize(14).fillColor('#0f172a').font('Helvetica-Bold').text('Firma electrónica');
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#1e293b').font('Helvetica');
  doc.text(`Firmante legal: ${input.nombreLegal}`);
  doc.text(`Fecha de firma: ${formatDateTime(input.fechaFirmado)}`);
  if (input.ipFirmado) doc.text(`IP del firmante: ${input.ipFirmado}`);
  if (input.userAgent) doc.text(`Navegador / dispositivo: ${input.userAgent}`);
  doc.moveDown(0.5);

  const firmaBuf = parseDataUrl(input.firmaDataUrl);
  if (firmaBuf) {
    const firmaW = 220;
    const firmaH = 90;
    doc
      .save()
      .lineWidth(1)
      .strokeColor('#cbd5e1')
      .rect(doc.x, doc.y, firmaW, firmaH)
      .stroke()
      .restore();
    try {
      doc.image(firmaBuf, doc.x + 4, doc.y + 4, { width: firmaW - 8, height: firmaH - 8 });
    } catch (err) {
      logger.warn({ err }, 'No se pudo incrustar la firma en el PDF');
    }
    doc.y += firmaH + 6;
  }

  doc.moveDown(1);

  // --- Cédula ---
  doc.fontSize(14).fillColor('#0f172a').font('Helvetica-Bold').text('Identidad verificada');
  doc.moveDown(0.4);
  doc.fontSize(10).fillColor('#475569').font('Helvetica');
  doc.text('Fotografías del documento de identidad del firmante:');
  doc.moveDown(0.6);

  const cedulaImgs: Array<{ url: string; label: string }> = [];
  if (input.cedulaFrenteUrl)
    cedulaImgs.push({ url: input.cedulaFrenteUrl, label: 'Cédula · Frente' });
  if (input.cedulaReversoUrl)
    cedulaImgs.push({ url: input.cedulaReversoUrl, label: 'Cédula · Reverso' });

  if (cedulaImgs.length === 0) {
    doc.fillColor('#94a3b8').font('Helvetica-Oblique').text('Sin fotografías cargadas.');
  } else {
    const imgW = (doc.page.width - doc.page.margins.left - doc.page.margins.right - 16) / 2;
    const imgH = 170;
    for (let i = 0; i < cedulaImgs.length; i++) {
      const slot = cedulaImgs[i]!;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = doc.page.margins.left + col * (imgW + 16);
      const y = doc.y + row * (imgH + 28);
      if (row === 0 && col === 0) {
        // primera iteración usa doc.y actual
      } else if (col === 0) {
        doc.y = y;
      }
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
    doc.y += imgH + 24;
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
