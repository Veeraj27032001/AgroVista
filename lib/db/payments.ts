import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';

export type PaymentPurpose = 'order' | 'subscription_term' | 'article_contribution';

export type PaymentLedgerEntry = {
  id: string;
  userId: string | null;
  purpose: PaymentPurpose;
  amountPaise: number;
  razorpayPaymentId: string | null;
  status: 'created' | 'captured' | 'failed' | 'partially_refunded' | 'refunded';
  createdAt: string;
};

type Row = {
  id: string;
  user_id: string | null;
  purpose: PaymentPurpose;
  amount_paise: number;
  razorpay_payment_id: string | null;
  status: PaymentLedgerEntry['status'];
  created_at: string;
};

const toEntry = (r: Row): PaymentLedgerEntry => ({
  id: r.id,
  userId: r.user_id,
  purpose: r.purpose,
  amountPaise: r.amount_paise,
  razorpayPaymentId: r.razorpay_payment_id,
  status: r.status,
  createdAt: r.created_at
});

/**
 * Records a captured payment in the unified ledger (spec §3.7 "every money
 * movement is a Payment"), regardless of which legacy table actually owns
 * the business record (issue_orders / subscriptions / article_payments).
 * This is what invoices attach to. amountRupees is converted to paise here
 * so call sites don't each need to import the money helper.
 */
export async function recordCapturedPayment(params: {
  userId?: string;
  purpose: PaymentPurpose;
  amountRupees: number;
  razorpayOrderId?: string;
  razorpayPaymentId: string;
  method?: string;
}): Promise<PaymentLedgerEntry> {
  const { data, error } = await getSupabaseAdmin()
    .from('payments')
    .insert({
      user_id: params.userId || null,
      purpose: params.purpose,
      amount_paise: Math.round(params.amountRupees * 100),
      razorpay_order_id: params.razorpayOrderId || null,
      razorpay_payment_id: params.razorpayPaymentId,
      method: params.method || null,
      status: 'captured',
      captured_at: new Date().toISOString()
    })
    .select('*')
    .single();
  if (error) throw error;
  return toEntry(data as Row);
}
