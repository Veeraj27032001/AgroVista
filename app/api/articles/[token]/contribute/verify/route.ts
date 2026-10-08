import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAdapter } from '@/lib/adapters/payment';
import { getSubmissionByToken } from '@/lib/db/submissions';
import { confirmContributionByOrderId } from '@/lib/article-payment-flow';

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

  const result = await confirmContributionByOrderId(orderId, paymentId);
  if (!result) return NextResponse.json({ error: 'order_not_found' }, { status: 404 });

  return NextResponse.json({ ok: true, ...result });
}
