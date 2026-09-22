import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '@/lib/config';
import type { NotifierAdapter, SendEmailParams, SendSmsParams } from '../types';

/**
 * Real notifier: email always sends via SMTP (Gmail App Password by default).
 * SMS is gated behind SMS_NOTIFICATIONS_ENABLED — email is the default channel,
 * and Fast2SMS stays off until that flag is explicitly set to true.
 */
export class EmailSmsNotifierAdapter implements NotifierAdapter {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;
    if (!config.smtp.host) return null;
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined
    });
    return this.transporter;
  }

  async sendEmail(params: SendEmailParams): Promise<void> {
    const t = this.getTransporter();
    if (!t) {
      console.log(`[email-sms notifier] no SMTP configured — logging instead: ${params.to}: ${params.subject}`);
      return;
    }
    await t.sendMail({ from: config.smtp.from, to: params.to, subject: params.subject, html: params.html });
  }

  async sendSms(params: SendSmsParams): Promise<void> {
    if (!config.fast2sms.smsEnabled) {
      console.log(`[email-sms notifier] SMS disabled (email is the default channel) — skipped for ${params.to}`);
      return;
    }
    if (!config.fast2sms.apiKey) {
      console.warn('[email-sms notifier] SMS_NOTIFICATIONS_ENABLED=true but FAST2SMS_API_KEY is missing — skipped');
      return;
    }

    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: config.fast2sms.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route: 'q',
        message: params.message,
        language: 'english',
        flash: 0,
        numbers: params.to.replace(/\D/g, '').slice(-10)
      })
    });
    if (!res.ok) {
      console.error('[email-sms notifier] Fast2SMS request failed:', res.status, await res.text());
    }
  }
}
