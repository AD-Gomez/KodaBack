import PDFDocument from 'pdfkit';
import sharp from 'sharp';

import { logger } from '../logger.js';
import type { FotoReparacion, ReparacionWithRelations } from '../../modules/reparaciones/domain/Reparacion.js';

export interface ReparacionPdfInput {
  reparacion: ReparacionWithRelations;
}

interface NormalizedFoto {
  id: string;
  nombreArchivo: string;
  observacion: string | null;
  png: Buffer | null;
  width: number;
  height: number;
  source: 'inline' | 'missing';
}

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

const PRIORIDAD_LABELS: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

const TIPO_LABELS: Record<string, string> = {
  PLOMERIA: 'Plomería',
  ELECTRICA: 'Eléctrica',
  AIRE_ACONDICIONADO: 'Aire acondicionado',
  JARDINERIA: 'Jardinería',
  CERRAJERIA: 'Cerrajería',
  PINTURA: 'Pintura',
  OTRO: 'Otro',
};

const TIPO_COLORS: Record<string, { bg: string; fg: string }> = {
  PLOMERIA: { bg: '#dbeafe', fg: '#1d4ed8' },
  ELECTRICA: { bg: '#fef3c7', fg: '#b45309' },
  AIRE_ACONDICIONADO: { bg: '#cffafe', fg: '#0e7490' },
  JARDINERIA: { bg: '#dcfce7', fg: '#15803d' },
  CERRAJERIA: { bg: '#e2e8f0', fg: '#334155' },
  PINTURA: { bg: '#fce7f3', fg: '#be185d' },
  OTRO: { bg: '#f1f5f9', fg: '#475569' },
};

const ESTADO_COLORS: Record<string, { bg: string; fg: string }> = {
  PENDIENTE: { bg: '#fef3c7', fg: '#b45309' },
  EN_PROCESO: { bg: '#dbeafe', fg: '#1d4ed8' },
  COMPLETADA: { bg: '#dcfce7', fg: '#15803d' },
  CANCELADA: { bg: '#e2e8f0', fg: '#475569' },
};

const PRIORIDAD_COLORS: Record<string, { bg: string; fg: string }> = {
  BAJA: { bg: '#e2e8f0', fg: '#475569' },
  MEDIA: { bg: '#dbeafe', fg: '#1d4ed8' },
  ALTA: { bg: '#fed7aa', fg: '#c2410c' },
  URGENTE: { bg: '#fecaca', fg: '#b91c1c' },
};

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    date,
  );
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function drawBadge(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  text: string,
  colors: { bg: string; fg: string },
) {
  doc.font('Helvetica-Bold').fontSize(8.5);
  const textWidth = doc.widthOfString(text);
  const paddingX = 8;
  const height = 16;
  const width = textWidth + paddingX * 2;
  doc.save();
  doc.roundedRect(x, y, width, height, 8).fillColor(colors.bg).fill();
  doc
    .fillColor(colors.fg)
    .text(text, x + paddingX, y + 4, { width: textWidth, lineBreak: false });
  doc.restore();
  return width;
}

function ensureSpace(doc: PDFKit.PDFDocument, required: number, margin: number) {
  if (doc.y + required > doc.page.height - margin) {
    doc.addPage();
  }
}

async function normalizeFoto(foto: FotoReparacion): Promise<NormalizedFoto> {
  try {
    const match = /^data:image\/[a-zA-Z+]+;base64,(.+)$/.exec(foto.datos);
    const raw = match ? Buffer.from(match[1]!, 'base64') : Buffer.from(foto.datos, 'base64');
    const pipeline = sharp(raw).rotate();
    const metadata = await pipeline.metadata();
    const png = await pipeline.png().toBuffer();
    return {
      id: foto.id,
      nombreArchivo: foto.nombreArchivo,
      observacion: foto.observacion,
      png,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      source: 'inline',
    };
  } catch (err) {
    logger.warn({ err, fotoId: foto.id }, 'No se pudo normalizar una foto para el PDF de reparaciones');
    return {
      id: foto.id,
      nombreArchivo: foto.nombreArchivo,
      observacion: foto.observacion,
      png: null,
      width: 0,
      height: 0,
      source: 'missing',
    };
  }
}

interface DrawFotoOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  total: number;
  nombreArchivo: string;
  observacion: string | null;
  png: Buffer | null;
  source: NormalizedFoto['source'];
}

function drawFotoSlot(doc: PDFKit.PDFDocument, opts: DrawFotoOptions) {
  const { x, y, width, height, index, total, nombreArchivo, observacion, png, source } = opts;

  doc.save();
  doc.lineWidth(0.8).strokeColor('#e2e8f0').rect(x, y, width, height).stroke();
  doc.restore();

  if (png) {
    try {
      doc.image(png, x, y, {
        fit: [width, height],
        align: 'center',
        valign: 'center',
      });
    } catch (err) {
      logger.warn({ err }, 'No se pudo incrustar una foto en el PDF de reparaciones');
    }
  } else if (source === 'missing') {
    doc
      .font('Helvetica-Oblique')
      .fontSize(10)
      .fillColor('#94a3b8')
      .text('Imagen no disponible', x + 8, y + height / 2 - 6, {
        width: width - 16,
        align: 'center',
      });
  }

  const captionY = y + height + 4;
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#0f172a')
    .text(`Foto ${String(index + 1).padStart(2, '0')} / ${total}`, x, captionY, {
      width,
      lineBreak: false,
    });

  const filename = nombreArchivo.length > 38 ? `${nombreArchivo.slice(0, 35)}…` : nombreArchivo;
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#64748b')
    .text(filename, x, captionY + 11, { width, lineBreak: false });

  if (observacion && observacion.trim()) {
    const note = observacion.trim();
    const noteMax = note.length > 90 ? `${note.slice(0, 87)}…` : note;
    doc
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor('#475569')
      .text(noteMax, x, captionY + 22, { width, lineBreak: true });
  }
}

export async function buildReparacionPdf(input: ReparacionPdfInput): Promise<Buffer> {
  const { reparacion } = input;
  const fotos = Array.isArray(reparacion.fotos) ? reparacion.fotos : [];
  const arrendatario = reparacion.departamento?.arrendatario;
  const normalized = await Promise.all(fotos.map(normalizeFoto));

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 56, bottom: 56, left: 56, right: 56 },
    info: {
      Title: reparacion.titulo || 'Manifiesto de reparación',
      Author: 'KodaHouse',
      Subject: 'Manifiesto de reparación y mantenimiento',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk as Buffer));

  const margin = 56;
  const innerWidth = doc.page.width - margin * 2;
  const tituloLimpio = (reparacion.titulo || 'Reparación').trim();

  // --- Encabezado ---
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#6366f1')
    .text('KODAHOUSE · MANTENIMIENTO', margin, margin, { characterSpacing: 1.4 });
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#0f172a')
    .text('Manifiesto de reparación', margin, margin + 16, { width: innerWidth });
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#475569')
    .text(
      `Solicitud #${reparacion.id.slice(0, 8)} · generada el ${formatDate(new Date())}`,
      margin,
      doc.y + 2,
      { width: innerWidth },
    );

  // --- Banda de badges ---
  const badgesY = doc.y + 14;
  let badgesX = margin;
  const badges: Array<{ text: string; colors: { bg: string; fg: string } }> = [
    {
      text: TIPO_LABELS[reparacion.tipo] || reparacion.tipo || 'OTRO',
      colors: TIPO_COLORS[reparacion.tipo] ?? TIPO_COLORS.OTRO,
    },
    {
      text: `Prioridad · ${PRIORIDAD_LABELS[reparacion.prioridad] || reparacion.prioridad}`,
      colors: PRIORIDAD_COLORS[reparacion.prioridad] ?? PRIORIDAD_COLORS.MEDIA,
    },
    {
      text: `Estado · ${ESTADO_LABELS[reparacion.estado] || reparacion.estado}`,
      colors: ESTADO_COLORS[reparacion.estado] ?? ESTADO_COLORS.PENDIENTE,
    },
  ];

  for (const badge of badges) {
    const badgeWidth = drawBadge(doc, badgesX, badgesY, badge.text, badge.colors);
    badgesX += badgeWidth + 8;
  }

  doc.y = badgesY + 28;

  // --- Tarjeta de información general ---
  const cardX = margin;
  const cardY = doc.y;
  const cardWidth = innerWidth;
  const cardHeight = 110;
  doc
    .save()
    .lineWidth(0.8)
    .strokeColor('#e2e8f0')
    .roundedRect(cardX, cardY, cardWidth, cardHeight, 12)
    .stroke()
    .restore();
  doc
    .save()
    .fillColor('#f8fafc')
    .roundedRect(cardX, cardY, cardWidth, cardHeight, 12)
    .fill()
    .restore();

  const colWidth = (cardWidth - 32) / 2;
  const colLeft = cardX + 16;
  const colRight = cardX + 16 + colWidth + 16;
  const colTitleY = cardY + 14;

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor('#94a3b8')
    .text('PROPIEDAD', colLeft, colTitleY, { characterSpacing: 1.2 });
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor('#0f172a')
    .text(reparacion.departamento?.nombre || '—', colLeft, colTitleY + 14, {
      width: colWidth,
    });
  if (reparacion.departamento?.direccion) {
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#475569')
      .text(reparacion.departamento.direccion, colLeft, colTitleY + 30, {
        width: colWidth,
      });
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor('#94a3b8')
    .text('SOLICITANTE', colRight, colTitleY, { characterSpacing: 1.2 });
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor('#0f172a')
    .text(reparacion.solicitante?.nombre || 'Equipo KodaHouse', colRight, colTitleY + 14, {
      width: colWidth,
    });
  if (reparacion.tecnico) {
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#475569')
      .text(`Técnico asignado: ${reparacion.tecnico}`, colRight, colTitleY + 30, {
        width: colWidth,
      });
  }

  // Segunda fila: fechas y costo
  const row2Y = cardY + cardHeight - 46;
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#94a3b8')
    .text('SOLICITADA', colLeft, row2Y, { characterSpacing: 1.1 });
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0f172a')
    .text(formatDate(reparacion.fechaSolicitud), colLeft, row2Y + 11, { width: colWidth });

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#94a3b8')
    .text('PROGRAMADA', colLeft + colWidth / 2, row2Y, { characterSpacing: 1.1 });
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0f172a')
    .text(formatDate(reparacion.fechaProgramada), colLeft + colWidth / 2, row2Y + 11, {
      width: colWidth / 2,
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#94a3b8')
    .text('COMPLETADA', colRight, row2Y, { characterSpacing: 1.1 });
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0f172a')
    .text(formatDate(reparacion.fechaCompletada), colRight, row2Y + 11, { width: colWidth });

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#94a3b8')
    .text('COSTO', colRight + colWidth / 2, row2Y, { characterSpacing: 1.1 });
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0f172a')
    .text(formatCurrency(reparacion.costo ? Number(reparacion.costo) : null), colRight + colWidth / 2, row2Y + 11, {
      width: colWidth / 2,
    });

  doc.y = cardY + cardHeight + 14;

  // --- Contacto del arrendatario ---
  if (arrendatario) {
    const contactY = doc.y;
    const contactHeight = 76;
    doc
      .save()
      .lineWidth(0.8)
      .strokeColor('#ddd6fe')
      .roundedRect(cardX, contactY, cardWidth, contactHeight, 12)
      .stroke()
      .fillColor('#fafaff')
      .roundedRect(cardX, contactY, cardWidth, contactHeight, 12)
      .fill()
      .restore();
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#7c3aed')
      .text('CONTACTO DEL ARRENDATARIO', colLeft, contactY + 13, { characterSpacing: 1.1 });
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#0f172a')
      .text(arrendatario.nombre, colLeft, contactY + 28, { width: colWidth });
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#475569')
      .text(`Tel. ${arrendatario.telefono}`, colRight, contactY + 28, { width: colWidth });
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#475569')
      .text(arrendatario.email, colRight, contactY + 44, { width: colWidth });
    doc.y = contactY + contactHeight + 18;
  }

  // --- Detalle de la solicitud ---
  ensureSpace(doc, 80, margin);
  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor('#94a3b8')
    .text('DETALLE DE LA SOLICITUD', margin, doc.y, { characterSpacing: 1.2 });
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#0f172a')
    .text(tituloLimpio, margin, doc.y + 4, { width: innerWidth });
  doc.y += 6;
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#1e293b')
    .text(reparacion.descripcion || 'Sin descripción registrada.', margin, doc.y, {
      width: innerWidth,
      lineGap: 3,
    });
  doc.moveDown(0.4);

  if (reparacion.notas && reparacion.notas.trim()) {
    ensureSpace(doc, 60, margin);
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#94a3b8')
      .text('NOTAS DEL EQUIPO', margin, doc.y, { characterSpacing: 1.2 });
    doc
      .font('Helvetica')
      .fontSize(10.5)
      .fillColor('#334155')
      .text(reparacion.notas.trim(), margin, doc.y + 4, {
        width: innerWidth,
        lineGap: 2,
      });
    doc.moveDown(0.4);
  }

  // --- Evidencia fotográfica ---
  if (normalized.length > 0) {
    ensureSpace(doc, 60, margin);
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#94a3b8')
      .text(`EVIDENCIA FOTOGRÁFICA · ${normalized.length} IMAGEN${normalized.length === 1 ? '' : 'ES'}`, margin, doc.y, {
        characterSpacing: 1.2,
      });
    doc.y += 16;

    const gap = 12;
    const cols = 2;
    const usableWidth = innerWidth - gap * (cols - 1);
    const cellWidth = usableWidth / cols;
    const cellHeight = 130;
    const captionHeight = 36;
    const rowHeight = cellHeight + gap + captionHeight;

    for (let i = 0; i < normalized.length; i += cols) {
      const rowIndex = Math.floor(i / cols);
      const rowY = doc.y + rowIndex * rowHeight;
      ensureSpace(doc, rowHeight, margin);

      for (let col = 0; col < cols; col += 1) {
        const foto = normalized[i + col];
        if (!foto) continue;
        const x = margin + col * (cellWidth + gap);

        drawFotoSlot(doc, {
          x,
          y: rowY,
          width: cellWidth,
          height: cellHeight,
          index: i + col,
          total: normalized.length,
          nombreArchivo: foto.nombreArchivo,
          observacion: foto.observacion,
          png: foto.png,
          source: foto.source,
        });
      }
    }
    doc.y += Math.ceil(normalized.length / cols) * rowHeight + 8;
  } else {
    ensureSpace(doc, 60, margin);
    doc
      .save()
      .lineWidth(0.8)
      .strokeColor('#e2e8f0')
      .roundedRect(margin, doc.y, innerWidth, 56, 12)
      .stroke()
      .restore();
    doc
      .font('Helvetica-Oblique')
      .fontSize(11)
      .fillColor('#94a3b8')
      .text('Sin evidencia fotográfica adjunta.', margin + 16, doc.y + 22, {
        width: innerWidth - 32,
      });
    doc.y += 72;
  }

  // --- Footer ---
  ensureSpace(doc, 50, margin);
  doc
    .strokeColor('#e2e8f0')
    .lineWidth(0.8)
    .moveTo(margin, doc.y)
    .lineTo(doc.page.width - margin, doc.y)
    .stroke();
  doc.moveDown(0.3);
  doc
    .fontSize(8)
    .fillColor('#94a3b8')
    .font('Helvetica')
    .text(
      'Documento generado por KodaHouse. Este manifiesto resume el estado actual de la solicitud de reparación al momento de la descarga.',
      margin,
      doc.y,
      { width: innerWidth, align: 'center' },
    );

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}
