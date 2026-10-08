import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAdapter } from '@/lib/adapters/payment';
import { getSubmissionByToken, updateSubmissionStatus } from '@/lib/db/submissions';
import {
  findContributionByOrderId,
  markContributionSuccess,
  sumSuccessfulContributions,
  updateSubmissionAmountPaid
} from '@/lib/db/article-payments';
import { notifyPartialPaymentReceived, notifyPaymentCompleted } from '@/lib/article-notifications';

/** POST /api/articles/[token]/contribute/verify  { orderId, paymentId, signature } — public, no login required. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const submission = await getSubmissionByToken(token);
  if (!submission) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { orderId, paymentId, signature } = body as { orderId?: string; paymentId?: string; signature?: string };
  if (!orderId || !paymentId || !signature) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const payment = getPaymentAdapter();
  const valid = payment.verifyPaymentSignature({ orderId, paymentId, signature });
  if (!valid) return NextResponse.json({ error: 'invalid_signature', message: 'Payment could not be verified.' }, { status: 400 });

  const contribution = await findContributionByOrderId(orderId);
  if (!contribution || contribution.submissionId !== submission.id) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
  }

  const confirmed = await markContributionSuccess(contribution.id, paymentId);
  const totalPaid = await sumSuccessfulContributions(submission.id);
  await updateSubmissionAmountPaid(submission.id, totalPaid);

  const charge = submission.publicationCharge || 0;

  if (totalPaid >= charge) {
    const finalSubmission = await updateSubmissionStatus(submission.id, 'payment_completed');
    await notifyPaymentCompleted({ ...finalSubmission, amountPaid: totalPaid });
  } else {
    const finalSubmission = await updateSubmissionStatus(submission.id, 'partially_paid');
    await notifyPartialPaymentReceived({ ...finalSubmission, amountPaid: totalPaid }, confirmed.contributorName, confirmed.amount);
  }

  return NextResponse.json({ ok: true, amountPaid: totalPaid, balance: Math.max(0, charge - totalPaid) });
}
