import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPaymentAdapter } from '@/lib/adapters/payment';
import { findOrderByRazorpayOrderId } from '@/lib/db/orders';
import { findByRazorpayOrderId, findByRazorpaySubId, markSubscriptionActive, cancelOtherActiveSubscriptions } from '@/lib/db/subscriptions';
import { recordCouponUsage } from '@/lib/db/coupons';
import { confirmIssueOrderByRazorpayOrderId, confirmSubscriptionOrderByRazorpayOrderId } from '@/lib/issue-payment-flow';

/**
 * POST /api/payment/verify  { type, orderId?, subscriptionId?, paymentId, signature }
 * Plan §11.1/§11.2 — verifies signature, then records the paid order or activates the
 * subscription. `subscriptionId` (instead of `orderId`) means this was an autopay mandate
 * checkout, which needs the mandate signature formula, not the order one. The actual
 * confirmation logic is shared with the Razorpay webhook (lib/issue-payment-flow.ts) so
 * a payment still completes even if the browser never returns to call this route.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { orderId, subscriptionId, paymentId, signature, type } = body as {
    orderId?: string;
    subscriptionId?: string;
    paymentId: string;
    signature: string;
    type: 'issue' | 'subscription';
  };

  if ((!orderId && !subscriptionId) || !paymentId || !signature || !type) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const payment = getPaymentAdapter();

  if (subscriptionId) {
    const valid = payment.verifyMandatePaymentSignature({ subscriptionId, paymentId, signature });
    if (!valid) {
      return NextResponse.json({ error: 'invalid_signature', message: 'Payment could not be verified.' }, { status: 400 });
    }

    const pendingSub = await findByRazorpaySubId(subscriptionId);
    if (!pendingSub) return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
    if (pendingSub.userId !== session.userId) return NextResponse.json({ error: 'order_user_mismatch' }, { status: 403 });

    const sub = await markSubscriptionActive(pendingSub.id, paymentId);
    await cancelOtherActiveSubscriptions(session.userId, sub.id);
    if (sub.couponId) await recordCouponUsage({ couponId: sub.couponId, userId: session.userId, subId: sub.id });

    return NextResponse.json({ ok: true, subscriptionId: sub.id });
  }

  const valid = payment.verifyPaymentSignature({ orderId: orderId!, paymentId, signature });
  if (!valid) {
    return NextResponse.json({ error: 'invalid_signature', message: 'Payment could not be verified.' }, { status: 400 });
  }

  if (type === 'issue') {
    const pending = await findOrderByRazorpayOrderId(orderId!);
    if (!pending) return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
    if (pending.userId !== session.userId) return NextResponse.json({ error: 'order_user_mismatch' }, { status: 403 });

    const result = await confirmIssueOrderByRazorpayOrderId(orderId!, paymentId);
    if (!result) return NextResponse.json({ ok: true, orderId: pending.id, issueId: pending.issueId });
    return NextResponse.json({ ok: true, ...result });
  }

  const pendingSub = await findByRazorpayOrderId(orderId!);
  if (!pendingSub) return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
  if (pendingSub.userId !== session.userId) return NextResponse.json({ error: 'order_user_mismatch' }, { status: 403 });

  const result = await confirmSubscriptionOrderByRazorpayOrderId(orderId!, paymentId);
  if (!result) return NextResponse.json({ ok: true, subscriptionId: pendingSub.id });
  return NextResponse.json({ ok: true, ...result });
}
