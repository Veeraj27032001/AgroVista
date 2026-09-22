import 'server-only';

export interface StorageAdapter {
  /** Ensures a bucket exists (no-op if it already does). */
  ensureBucket(bucket: string, isPublic: boolean): Promise<void>;
  /** Uploads a file, overwriting any existing object at that path. */
  upload(bucket: string, path: string, data: Buffer, contentType: string): Promise<void>;
  /** Downloads a file's bytes. */
  download(bucket: string, path: string): Promise<Buffer>;
  /** Public URL for a file in a public bucket. */
  getPublicUrl(bucket: string, path: string): string;
  /** Time-limited signed URL for a file in a private bucket. */
  getSignedUrl(bucket: string, path: string, expiresInSeconds: number): Promise<string>;
  /** Deletes a file. */
  remove(bucket: string, path: string): Promise<void>;
}

export type CreateOrderParams = { amountRupees: number; receipt: string; notes: Record<string, string> };
export type CreateOrderResult = { id: string; amount: number; currency: string };
export type VerifyPaymentParams = { orderId: string; paymentId: string; signature: string };
export type VerifyMandatePaymentParams = { subscriptionId: string; paymentId: string; signature: string };
export type VerifyWebhookParams = { rawBody: string; signature: string };
export type CreateRefundParams = { paymentId: string; amountRupees?: number };
export type CreateRefundResult = { id: string; status: string };

export type CreatePlanParams = { amountRupees: number; intervalMonths: number; name: string };
export type CreatePlanResult = { id: string };
export type CreateMandateSubscriptionParams = {
  planId: string;
  totalCycles: number;
  notes: Record<string, string>;
};
export type CreateMandateSubscriptionResult = { id: string };

export interface PaymentAdapter {
  /** The public key id the client-side Razorpay Checkout script needs. Empty string for the stub adapter. */
  readonly keyId: string;
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyPaymentSignature(params: VerifyPaymentParams): boolean;
  verifyMandatePaymentSignature(params: VerifyMandatePaymentParams): boolean;
  verifyWebhookSignature(params: VerifyWebhookParams): boolean;
  createRefund(params: CreateRefundParams): Promise<CreateRefundResult>;

  // ---- Autopay (recurring mandate via Razorpay Subscriptions API) ----
  /** Creates (or the stub fakes) a billing Plan that a mandate Subscription is created against. */
  createPlan(params: CreatePlanParams): Promise<CreatePlanResult>;
  /** Creates the mandate Subscription. Client-side Checkout opens with `subscription_id`, not `order_id`. */
  createMandateSubscription(params: CreateMandateSubscriptionParams): Promise<CreateMandateSubscriptionResult>;
  cancelMandateSubscription(razorpaySubscriptionId: string): Promise<void>;
}

export type SendEmailParams = { to: string; subject: string; html: string };
export type SendSmsParams = { to: string; message: string };

export interface NotifierAdapter {
  sendEmail(params: SendEmailParams): Promise<void>;
  /** No-ops unless SMS_NOTIFICATIONS_ENABLED=true — email is the default channel. */
  sendSms(params: SendSmsParams): Promise<void>;
}
