import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';

export type AuthorPayoutMethod = 'upi' | 'bank_transfer' | 'other';
export type AuthorPayoutStatus = 'pending' | 'paid';

export type AuthorPayout = {
  id: string;
  submissionId: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  method: AuthorPayoutMethod | null;
  referenceNote: string | null;
  status: AuthorPayoutStatus;
  paidBy: string | null;
  paidAt: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  submission_id: string;
  recipient_name: string;
  recipient_email: string;
  amount: number;
  method: AuthorPayoutMethod | null;
  reference_note: string | null;
  status: AuthorPayoutStatus;
  paid_by: string | null;
  paid_at: string | null;
  created_at: string;
};

const toPayout = (r: Row): AuthorPayout => ({
  id: r.id,
  submissionId: r.submission_id,
  recipientName: r.recipient_name,
  recipientEmail: r.recipient_email,
  amount: Number(r.amount),
  method: r.method,
  referenceNote: r.reference_note,
  status: r.status,
  paidBy: r.paid_by,
  paidAt: r.paid_at,
  createdAt: r.created_at
});

export async function listPayoutsForSubmission(submissionId: string): Promise<AuthorPayout[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('author_payouts')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(toPayout);
}

export async function recordAuthorPayout(params: {
  submissionId: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  method?: AuthorPayoutMethod;
  referenceNote?: string;
  paidBy: string;
}): Promise<AuthorPayout> {
  const { data, error } = await getSupabaseAdmin()
    .from('author_payouts')
    .insert({
      submission_id: params.submissionId,
      recipient_name: params.recipientName,
      recipient_email: params.recipientEmail,
      amount: params.amount,
      method: params.method || null,
      reference_note: params.referenceNote || null,
      status: 'paid',
      paid_by: params.paidBy,
      paid_at: new Date().toISOString()
    })
    .select('*')
    .single();
  if (error) throw error;
  return toPayout(data as Row);
}
