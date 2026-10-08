import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAdapter } from '@/lib/adapters/payment';
import { getSubmissionByToken } from '@/lib/db/submissions';
import { createPendingContribution } from '@/lib/db/article-payments';

/** POST /api/articles/[token]/contribute/create-order  { name, email, amount } — public, no login required. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const submission = await getSubmissionByToken(token);
  if (!submission) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!['payment_pending', 'partially_paid'].includes(submission.status)) {
    return NextResponse.json({ error: 'not_payable', message: 'This article is not currently accepting payments.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const amount = Number(body.amount);

  if (!name || !email || !amount || amount <= 0) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const balance = (submission.publicationCharge || 0) - submission.amountPaid;
  if (amount > balance + 0.01) {
    return NextResponse.json({ error: 'amount_exceeds_balance', message: `Amount exceeds the remaining balance of ₹${balance}.` }, { status: 400 });
  }

  const payment = getPaymentAdapter();
  const order = await payment.createOrder({
    amountRupees: amount,
    receipt: `article-${submission.articleCode}-${Date.now()}`,
    notes: { submissionId: submission.id, contributorEmail: email }
  });

  await createPendingContribution({
    submissionId: submission.id,
    contributorName: name,
    contributorEmail: email,
    amount,
    razorpayOrderId: order.id
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: payment.keyId });
}
