import 'server-only';
import crypto from 'crypto';
import type {
  CreateMandateSubscriptionParams,
  CreateMandateSubscriptionResult,
  CreateOrderParams,
  CreateOrderResult,
  CreatePlanParams,
  CreatePlanResult,
  CreateRefundParams,
  CreateRefundResult,
  PaymentAdapter,
  VerifyMandatePaymentParams,
  VerifyPaymentParams,
  VerifyWebhookParams
} from '../types';

/** Fake payments — always "succeeds". Used when PAYMENT_ADAPTER=stub (no Razorpay configured yet). */
export class StubPaymentAdapter implements PaymentAdapter {
  readonly keyId = 'stub_key';

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const id = `stub_order_${crypto.randomBytes(8).toString('hex')}`;
    console.log(`[stub payment] createOrder(${JSON.stringify(params)}) -> ${id}`);
    return { id, amount: Math.round(params.amountRupees * 100), currency: 'INR' };
  }

  verifyPaymentSignature(params: VerifyPaymentParams): boolean {
    console.log(`[stub payment] verifyPaymentSignature(${JSON.stringify(params)}) -> true`);
    return true;
  }

  verifyMandatePaymentSignature(params: VerifyMandatePaymentParams): boolean {
    console.log(`[stub payment] verifyMandatePaymentSignature(${JSON.stringify(params)}) -> true`);
    return true;
  }

  verifyWebhookSignature(params: VerifyWebhookParams): boolean {
    console.log('[stub payment] verifyWebhookSignature -> true');
    return true;
  }

  async createRefund(params: CreateRefundParams): Promise<CreateRefundResult> {
    const id = `stub_refund_${crypto.randomBytes(8).toString('hex')}`;
    console.log(`[stub payment] createRefund(${JSON.stringify(params)}) -> ${id}`);
    return { id, status: 'processed' };
  }

  async createPlan(params: CreatePlanParams): Promise<CreatePlanResult> {
    const id = `stub_plan_${crypto.randomBytes(8).toString('hex')}`;
    console.log(`[stub payment] createPlan(${JSON.stringify(params)}) -> ${id}`);
    return { id };
  }

  async createMandateSubscription(params: CreateMandateSubscriptionParams): Promise<CreateMandateSubscriptionResult> {
    const id = `stub_sub_${crypto.randomBytes(8).toString('hex')}`;
    console.log(`[stub payment] createMandateSubscription(${JSON.stringify(params)}) -> ${id}`);
    return { id };
  }

  async cancelMandateSubscription(razorpaySubscriptionId: string): Promise<void> {
    console.log(`[stub payment] cancelMandateSubscription(${razorpaySubscriptionId})`);
  }
}
