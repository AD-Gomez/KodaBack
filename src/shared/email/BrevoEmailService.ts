import { env } from '../../config/env.js';
import { logger } from '../logger.js';

import type { EmailService, SendEmailOptions } from './EmailService.js';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

interface BrevoResponse {
  messageId: string;
}

export class BrevoEmailService implements EmailService {
  async send(options: SendEmailOptions): Promise<{ messageId: string }> {
    const apiKey = env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error(
        'BREVO_API_KEY no está configurada. Define la variable de entorno para habilitar el envío de correos.',
      );
    }

    const payload = {
      sender: { email: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME },
      to: [{ email: options.to.email, name: options.to.name }],
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text,
      replyTo: options.replyTo,
      attachment: options.attachment,
    };

    let res: Response;
    try {
      res = await fetch(BREVO_ENDPOINT, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      logger.error({ err, to: options.to.email }, 'Error de red al llamar a Brevo');
      throw new Error('No se pudo contactar al proveedor de correo');
    }

    if (!res.ok) {
      const body = await res.text();
      logger.error(
        { status: res.status, body, to: options.to.email, subject: options.subject },
        'Brevo rechazó el envío de correo',
      );
      throw new Error(`Brevo rechazó el envío (${res.status})`);
    }

    const data = (await res.json()) as BrevoResponse;
    logger.info(
      { to: options.to.email, subject: options.subject, messageId: data.messageId },
      'Correo enviado vía Brevo',
    );
    return { messageId: data.messageId };
  }
}

export const emailService: EmailService = new BrevoEmailService();