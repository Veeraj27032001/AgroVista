import 'server-only';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '@/lib/config';
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

export class RazorpayPaymentAdapter implements PaymentAdapter {
  readonly keyId = config.razorpay.keyId;
  private client: Razorpay | null = null;

  private getClient(): Razorpay {
    if (this.client) return this.client;
    if (!config.razorpay.keyId || !config.razorpay.keySecret) {
      throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local');
    }
    this.client = new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
    return this.client;
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const order = await this.getClient().orders.create({
      amount: Math.round(params.amountRupees * 100),
      currency: config.currency,
      receipt: params.receipt,
      notes: params.notes
    });
    return { id: order.id, amount: Number(order.amount), currency: order.currency };
  }

  verifyPaymentSignature(params: VerifyPaymentParams): boolean {
    const expected = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${params.orderId}|${params.paymentId}`)
      .digest('hex');
    return expected === params.signature;
  }

  verifyMandatePaymentSignature(params: VerifyMandatePaymentParams): boolean {
    const expected = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${params.paymentId}|${params.subscriptionId}`)
      .digest('hex');
    return expected === params.signature;
  }

  verifyWebhookSignature(params: VerifyWebhookParams): boolean {
    if (!config.razorpay.webhookSecret) return false;
    const expected = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(params.rawBody)
      .digest('hex');
    return expected === params.signature;
  }

  async createRefund(params: CreateRefundParams): Promise<CreateRefundResult> {
    const body = params.amountRupees ? { amount: Math.round(params.amountRupees * 100) } : {};
    const refund = await this.getClient().payments.refund(params.paymentId, body);
    return { id: refund.id, status: refund.status };
  }

  async createPlan(params: CreatePlanParams): Promise<CreatePlanResult> {
    const plan = await this.getClient().plans.create({
      period: 'monthly',
      interval: params.intervalMonths,
      item: {
        name: params.name,
        amount: Math.round(params.amountRupees * 100),
        currency: config.currency
      }
    });
    return { id: plan.id };
  }

  async createMandateSubscription(params: CreateMandateSubscriptionParams): Promise<CreateMandateSubscriptionResult> {
    const sub = await this.getClient().subscriptions.create({
      plan_id: params.planId,
      total_count: params.totalCycles,
      customer_notify: 1,
      notes: params.notes
    });
    return { id: sub.id };
  }

  async cancelMandateSubscription(razorpaySubscriptionId: string): Promise<void> {
    await this.getClient().subscriptions.cancel(razorpaySubscriptionId);
  }
}
