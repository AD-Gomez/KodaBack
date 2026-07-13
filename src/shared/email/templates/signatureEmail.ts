import { env } from '../../../config/env.js';

export interface SignatureEmailParams {
  firmanteNombre: string;
  departamentoNombre: string;
  contratoId: string;
  contratoTitulo?: string | null;
  fechaInicio: Date;
  fechaFin: Date;
  token: string;
  remitenteNombre?: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildSignatureLink(token: string): string {
  const base = env.FRONTEND_PUBLIC_URL.replace(/\/+$/, '');
  return `${base}/firmar/${token}`;
}

export function buildSignatureEmail(params: SignatureEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const link = buildSignatureLink(params.token);
  const departamento = escapeHtml(params.departamentoNombre || 'tu propiedad');
  const titulo = params.contratoTitulo ? escapeHtml(params.contratoTitulo) : null;
  const firmante = escapeHtml(params.firmanteNombre);
  const remitente = escapeHtml(params.remitenteNombre || 'el equipo de KodaHouse');

  const subject = `Firma pendiente · Contrato ${departamento}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f6fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
            <tr>
              <td style="background:linear-gradient(135deg,#10b981,#6366f1);padding:24px 32px;color:#ffffff;">
                <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;opacity:0.85;">KodaHouse · Legal</p>
                <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;font-weight:800;">Tienes un contrato por firmar</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;">
                <p style="margin:0;font-size:15px;line-height:1.55;">Hola <strong>${firmante}</strong>,</p>
                <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#475569;">
                  ${remitente} ha preparado un contrato para <strong>${departamento}</strong> y requiere tu firma electrónica para continuar con el proceso.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                  <tr><td style="padding:14px 18px;">
                    <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;color:#64748b;">Contrato</p>
                    <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#0f172a;">${titulo ?? `Contrato de arrendamiento · ${departamento}`}</p>
                    <p style="margin:10px 0 0;font-size:12px;color:#475569;">Vigencia: <strong>${formatDate(params.fechaInicio)}</strong> — <strong>${formatDate(params.fechaFin)}</strong></p>
                    <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Folio: ${params.contratoId.slice(0, 8)}</p>
                  </td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px;text-align:center;">
                <a href="${link}" target="_blank" rel="noopener" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:999px;letter-spacing:0.02em;">
                  Revisar y firmar contrato →
                </a>
                <p style="margin:14px 0 0;font-size:12px;color:#64748b;line-height:1.55;">
                  El enlace es único y te llevará a una página segura para revisar y firmar el documento.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px;">
                <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
                  <a href="${link}" style="color:#6366f1;word-break:break-all;">${link}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.55;">
                  Recibiste este correo porque ${remitente} registró tu dirección como firmante en KodaHouse. Si no esperabas este mensaje, puedes ignorar este correo o escribirnos a legal@kodahouses.com.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} KodaHouse</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Hola ${params.firmanteNombre},`,
    '',
    `${params.remitenteNombre || 'El equipo de KodaHouse'} ha preparado un contrato para ${params.departamentoNombre || 'tu propiedad'} y requiere tu firma electrónica.`,
    '',
    `Contrato: ${params.contratoTitulo || `Contrato de arrendamiento · ${params.departamentoNombre || 'tu propiedad'}`}`,
    `Vigencia: ${formatDate(params.fechaInicio)} — ${formatDate(params.fechaFin)}`,
    `Folio: ${params.contratoId.slice(0, 8)}`,
    '',
    `Revisa y firma el documento desde el siguiente enlace:`,
    link,
    '',
    'Si no esperabas este mensaje, puedes ignorar este correo o escribirnos a legal@kodahouses.com.',
    '',
    '© KodaHouse',
  ].join('\n');

  return { subject, html, text };
}