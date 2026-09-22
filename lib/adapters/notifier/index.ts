import 'server-only';
import { config } from '@/lib/config';
import type { NotifierAdapter } from '../types';
import { StubNotifierAdapter } from './stub';
import { EmailSmsNotifierAdapter } from './email-sms';

let instance: NotifierAdapter | null = null;

export function getNotifierAdapter(): NotifierAdapter {
  if (instance) return instance;
  instance = config.adapters.notifier === 'email-sms' ? new EmailSmsNotifierAdapter() : new StubNotifierAdapter();
  return instance;
}
