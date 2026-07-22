interface ContractExpirationEmailParams {
  administradorNombre: string;
  contratoTitulo?: string | null;
  departamentoNombre: string;
  arrendatarioNombre: string;
  fechaFin: Date;
  contratoId: string;
  contractUrl: string;
  diasAvisoVencimiento: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Caracas',
  }).format(value);
}

export function buildContractExpirationEmail(params: ContractExpirationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const contrato = params.contratoTitulo?.trim() || `Contrato de ${params.departamentoNombre}`;
  const fechaFin = formatDate(params.fechaFin);
  const nombre = escapeHtml(params.administradorNombre);
  const contratoSeguro = escapeHtml(contrato);
  const departamento = escapeHtml(params.departamentoNombre);
  const arrendatario = escapeHtml(params.arrendatarioNombre);
  const enlace = escapeHtml(params.contractUrl);

  return {
    subject: `Contrato por vencer en ${params.diasAvisoVencimiento} días · ${params.departamentoNombre}`,
    html: `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f8fafc;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 32px;background:#fff7ed;border-bottom:1px solid #fed7aa;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.12em;color:#c2410c;text-transform:uppercase;">Recordatorio de vigencia</p>
            <h1 style="margin:0;font-size:24px;line-height:1.2;color:#9a3412;">Un contrato vence en ${params.diasAvisoVencimiento} días</h1>
          </td></tr>
          <tr><td style="padding:28px 32px;">
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Hola ${nombre},</p>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">El contrato <strong>${contratoSeguro}</strong> del departamento <strong>${departamento}</strong>, correspondiente a <strong>${arrendatario}</strong>, vence el <strong>${fechaFin}</strong>.</p>
            <p style="margin:0 0 26px;font-size:14px;line-height:1.6;color:#475569;">Revisa el contrato y gestiona su renovación antes de la fecha de vencimiento.</p>
            <a href="${enlace}" target="_blank" rel="noopener" style="display:inline-block;padding:13px 22px;border-radius:999px;background:#ea580c;color:#fff;font-size:14px;font-weight:700;text-decoration:none;">Revisar contrato</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
    text: [
      `Hola ${params.administradorNombre},`,
      '',
      `El contrato ${contrato} del departamento ${params.departamentoNombre}, correspondiente a ${params.arrendatarioNombre}, vence el ${fechaFin}.`,
      'Revisa el contrato y gestiona su renovación antes de la fecha de vencimiento.',
      '',
      `Revisar contrato: ${params.contractUrl}`,
    ].join('\n'),
  };
}
