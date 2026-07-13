export interface SendEmailAttachment {
  url?: string;
  content?: string;
  name: string;
}

export interface SendEmailOptions {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text?: string;
  replyTo?: { email: string; name?: string };
  attachment?: SendEmailAttachment[];
}

export interface EmailService {
  send(options: SendEmailOptions): Promise<{ messageId: string }>;
}