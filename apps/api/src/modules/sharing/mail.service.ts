import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface MailMessage {
  to: string;
  cc?: string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
  /** Override the From header; otherwise MAIL_FROM (or a placeholder) is used. */
  from?: string;
}

export interface MailResult {
  status: 'SENT' | 'FAILED';
  provider: string;
  messageId?: string;
  error?: string;
}

/**
 * Provider-agnostic mail sender. The provider is selected by `MAIL_PROVIDER`
 * (`log` | `resend` | `smtp`), so quotation sharing never hardcodes a vendor
 * (spec §12):
 *
 *   MAIL_PROVIDER=log                (default) — records the message, no send
 *   MAIL_PROVIDER=resend             RESEND_API_KEY, MAIL_FROM
 *   MAIL_PROVIDER=smtp               SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM
 *
 * The Resend / SMTP packages are imported lazily and any missing config or send
 * error degrades to the log provider or a FAILED result — the API always boots.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly provider = (process.env.MAIL_PROVIDER ?? 'log').toLowerCase();

  async send(message: MailMessage): Promise<MailResult> {
    switch (this.provider) {
      case 'resend':
        return this.sendViaResend(message);
      case 'smtp':
        return this.sendViaSmtp(message);
      default:
        return this.sendViaLog(message);
    }
  }

  private sendViaLog(message: MailMessage): MailResult {
    this.logger.log(
      `[mail:log] from=${this.from(message)} to=${message.to} subject="${message.subject}" ` +
        `attachments=${message.attachments?.length ?? 0}`,
    );
    return { status: 'SENT', provider: 'log', messageId: `log-${randomUUID()}` };
  }

  private async sendViaResend(message: MailMessage): Promise<MailResult> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn('MAIL_PROVIDER=resend but RESEND_API_KEY is unset; logging instead.');
      return this.sendViaLog(message);
    }
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: this.from(message),
        to: message.to,
        cc: message.cc,
        subject: message.subject,
        text: message.text,
        html: message.html ?? message.text,
        attachments: message.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
      });
      if (error) return { status: 'FAILED', provider: 'resend', error: error.message };
      return { status: 'SENT', provider: 'resend', messageId: data?.id };
    } catch (err) {
      return { status: 'FAILED', provider: 'resend', error: (err as Error).message };
    }
  }

  private async sendViaSmtp(message: MailMessage): Promise<MailResult> {
    const host = process.env.SMTP_HOST;
    if (!host) {
      this.logger.warn('MAIL_PROVIDER=smtp but SMTP_HOST is unset; logging instead.');
      return this.sendViaLog(message);
    }
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      const info = await transporter.sendMail({
        from: this.from(message),
        to: message.to,
        cc: message.cc,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });
      return { status: 'SENT', provider: 'smtp', messageId: info.messageId };
    } catch (err) {
      return { status: 'FAILED', provider: 'smtp', error: (err as Error).message };
    }
  }

  private from(message: MailMessage): string {
    return message.from ?? process.env.MAIL_FROM ?? 'Hardware POS <no-reply@hardware-pos.local>';
  }
}
