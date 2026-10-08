import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { ArticlePayment, ArticlePaymentStatus } from '@/lib/types';

type PaymentRow = {
  id: string;
  submission_id: string;
  contributor_name: string;
  contributor_email: string;
  amount: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: ArticlePaymentStatus;
  created_at: string;
};

const toPayment = (r: PaymentRow): ArticlePayment => ({
  id: r.id,
  submissionId: r.submission_id,
  contributorName: r.contributor_name,
  contributorEmail: r.contributor_email,
  amount: Number(r.amount),
  razorpayOrderId: r.razorpay_order_id,
  razorpayPaymentId: r.razorpay_payment_id,
  status: r.status,
  createdAt: r.created_at
});

export async function createPendingContribution(params: {
  submissionId: string;
  contributorName: string;
  contributorEmail: string;
  amount: number;
  razorpayOrderId: string;
}): Promise<ArticlePayment> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_payments')
    .insert({
      submission_id: params.submissionId,
      contributor_name: params.contributorName,
      contributor_email: params.contributorEmail,
      amount: params.amount,
      razorpay_order_id: params.razorpayOrderId,
      status: 'pending'
    })
    .select('*')
    .single();
  if (error) throw error;
  return toPayment(data as PaymentRow);
}

export async function findContributionByOrderId(razorpayOrderId: string): Promise<ArticlePayment | null> {
  const { data, error } = await getSupabaseAdmin().from('article_payments').select('*').eq('razorpay_order_id', razorpayOrderId).maybeSingle();
  if (error) throw error;
  return data ? toPayment(data as PaymentRow) : null;
}

export async function markContributionSuccess(id: string, razorpayPaymentId: string): Promise<ArticlePayment> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_payments')
    .update({ status: 'success', razorpay_payment_id: razorpayPaymentId })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toPayment(data as PaymentRow);
}

export async function listPaymentsForSubmission(submissionId: string): Promise<ArticlePayment[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_payments')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as PaymentRow[]).map(toPayment);
}

/** Sum of successful payments for the submission, recomputed from the ledger (source of truth over the denormalized amount_paid). */
export async function sumSuccessfulContributions(submissionId: string): Promise<number> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_payments')
    .select('amount')
    .eq('submission_id', submissionId)
    .eq('status', 'success');
  if (error) throw error;
  return (data as { amount: number }[]).reduce((sum, r) => sum + Number(r.amount), 0);
}

export async function updateSubmissionAmountPaid(submissionId: string, amountPaid: number): Promise<void> {
  const { error } = await getSupabaseAdmin().from('article_submissions').update({ amount_paid: amountPaid }).eq('id', submissionId);
  if (error) throw error;
}

/** Pending contributions older than `olderThanMinutes` — for job J2 (expire stale contribution attempts). */
export async function listStalePendingContributions(olderThanMinutes: number): Promise<ArticlePayment[]> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();
  const { data, error } = await getSupabaseAdmin().from('article_payments').select('*').eq('status', 'pending').lt('created_at', cutoff);
  if (error) throw error;
  return (data as PaymentRow[]).map(toPayment);
}

export async function expireContribution(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('article_payments').update({ status: 'expired' }).eq('id', id);
  if (error) throw error;
}
