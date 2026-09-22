import 'server-only';
import { config } from '@/lib/config';
import type { PaymentAdapter } from '../types';
import { StubPaymentAdapter } from './stub';
import { RazorpayPaymentAdapter } from './razorpay';

let instance: PaymentAdapter | null = null;

export function getPaymentAdapter(): PaymentAdapter {
  if (instance) return instance;
  instance = config.adapters.payment === 'razorpay' ? new RazorpayPaymentAdapter() : new StubPaymentAdapter();
  return instance;
}
