import PDFDocument from 'pdfkit';
import axios from 'axios';
import sharp from 'sharp';

import { logger } from '../logger.js';

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
  version: number;
}

async function fetchAsPngBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: 15_000,
    });
    const raw = Buffer.from(res.data);
    return sharp(raw).rotate().png().toBuffer();
  } catch (err) {
    logger.warn({ err, url }, 'No se pudo descargar la imagen para el PDF');
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
  doc
    .fillColor('#0f172a')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('KodaHouse', { align: 'left' });
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
    doc.font(labelFont).fontSize(9).fillColor('#64748b').text(label.toUpperCase(), x, y, { width: colWidth - 8 });
    doc.font(valueFont).fontSize(11).fillColor('#0f172a').text(value || '—', x, y + 12, { width: colWidth - 8 });
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

  // --- Bloque de firma ---
  doc.fontSize(14).fillColor('#0f172a').font('Helvetica-Bold').text('Firma electrónica');
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#1e293b').font('Helvetica');
  doc.text(`Firmante legal: ${input.nombreLegal}`);
  doc.text(`Fecha de firma: ${formatDateTime(input.fechaFirmado)}`);
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
  if (input.cedulaFrenteUrl) cedulaImgs.push({ url: input.cedulaFrenteUrl, label: 'Cédula · Frente' });
  if (input.cedulaReversoUrl) cedulaImgs.push({ url: input.cedulaReversoUrl, label: 'Cédula · Reverso' });

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
          doc.image(png, x, y, { width: imgW, height: imgH, fit: [imgW, imgH], align: 'center', valign: 'center' });
        } catch (err) {
          logger.warn({ err, url: slot.url }, 'No se pudo incrustar la imagen de cédula en el PDF');
        }
      } else {
        doc
          .save()
          .lineWidth(1)
          .strokeColor('#cbd5e1')
          .rect(x, y, imgW, imgH)
          .stroke()
          .restore();
        doc.fillColor('#94a3b8').fontSize(10).text('Imagen no disponible', x + 8, y + imgH / 2 - 6, { width: imgW - 16 });
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