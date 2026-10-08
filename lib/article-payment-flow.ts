import 'server-only';
import { getSubmission, updateSubmissionStatus } from '@/lib/db/submissions';
import { findContributionByOrderId, markContributionSuccess, sumSuccessfulContributions, updateSubmissionAmountPaid } from '@/lib/db/article-payments';
import { notifyPartialPaymentReceived, notifyPaymentCompleted } from '@/lib/article-notifications';
import { recordPaymentAndIssueInvoice } from '@/lib/invoice-flow';

/**
 * Confirms an article-contribution payment by Razorpay order id — shared by
 * the client-side verify call (/api/articles/[token]/contribute/verify) and
 * the Razorpay webhook, so a missed client callback still completes the flow.
 * Returns null if no matching pending contribution is found (e.g. this order
 * id belongs to an issue purchase or subscription instead).
 */
export async function confirmContributionByOrderId(orderId: string, paymentId: string) {
  const contribution = await findContributionByOrderId(orderId);
  if (!contribution || contribution.status === 'success') return null;

  const submission = await getSubmission(contribution.submissionId);
  if (!submission) return null;

  const confirmed = await markContributionSuccess(contribution.id, paymentId);
  const totalPaid = await sumSuccessfulContributions(submission.id);
  await updateSubmissionAmountPaid(submission.id, totalPaid);

  await recordPaymentAndIssueInvoice({
    purpose: 'article_contribution',
    amountRupees: confirmed.amount,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    productType: 'publication_charge',
    description: `Publication charge contribution — ${submission.articleCode}`,
    billedToName: confirmed.contributorName,
    billedToEmail: confirmed.contributorEmail
  });

  const charge = submission.publicationCharge || 0;
  if (totalPaid >= charge) {
    const finalSubmission = await updateSubmissionStatus(submission.id, 'payment_completed');
    await notifyPaymentCompleted({ ...finalSubmission, amountPaid: totalPaid });
  } else {
    const finalSubmission = await updateSubmissionStatus(submission.id, 'partially_paid');
    await notifyPartialPaymentReceived({ ...finalSubmission, amountPaid: totalPaid }, confirmed.contributorName, confirmed.amount);
  }

  return { amountPaid: totalPaid, balance: Math.max(0, charge - totalPaid) };
}
