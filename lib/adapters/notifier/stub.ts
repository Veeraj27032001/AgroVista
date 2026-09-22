import 'server-only';
import type { NotifierAdapter, SendEmailParams, SendSmsParams } from '../types';

/** No-op notifier — logs to console only. Used when NOTIFIER_ADAPTER=stub. */
export class StubNotifierAdapter implements NotifierAdapter {
  async sendEmail(params: SendEmailParams): Promise<void> {
    console.log(`[stub notifier] email -> ${params.to}: ${params.subject}`);
  }

  async sendSms(params: SendSmsParams): Promise<void> {
    console.log(`[stub notifier] sms -> ${params.to}: ${params.message}`);
  }
}
