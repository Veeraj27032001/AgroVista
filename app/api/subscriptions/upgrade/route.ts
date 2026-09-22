import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPaymentAdapter } from '@/lib/adapters/payment';
import { getActiveSubscriptionForUser, getPlan, createSubscription } from '@/lib/db/subscriptions';
import { DURATION_LABEL_TO_MONTHS } from '@/lib/subscription';

/**
 * POST /api/subscriptions/upgrade  { newPlanId }
 * Plan §10.3 — pro-rata: charges (new plan price - unused value of current plan).
 * The client then runs the normal Razorpay Checkout + /api/payment/verify flow
 * with type: 'subscription', which activates this new row and cancels the old one.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { newPlanId } = body as { newPlanId: string };
  if (!newPlanId) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const current = await getActiveSubscriptionForUser(session.userId);
  if (!current) return NextResponse.json({ error: 'no_active_subscription' }, { status: 400 });

  const newPlan = await getPlan(newPlanId);
  if (!newPlan || !newPlan.isActive) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const now = Date.now();
  const start = new Date(current.startDate).getTime();
  const end = new Date(current.endDate).getTime();
  const totalDays = Math.max(1, Math.round((end - start) / 86_400_000));
  const remainingDays = Math.max(0, Math.round((end - now) / 86_400_000));
  const unusedValue = (remainingDays / totalDays) * current.amountPaid;
  const amountToPay = Math.max(0, Math.round((newPlan.price - unusedValue + Number.EPSILON) * 100) / 100);

  const payment = getPaymentAdapter();
  const order = await payment.createOrder({
    amountRupees: amountToPay,
    receipt: `sub-upgrade-${newPlanId}-${Date.now()}`,
    notes: { userId: session.userId, planId: newPlanId, upgradeFrom: current.id }
  });

  const months = newPlan.durationMonths || DURATION_LABEL_TO_MONTHS[newPlan.durationLabel] || 1;
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);

  await createSubscription({
    userId: session.userId,
    planId: newPlanId,
    format: newPlan.format,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    amountPaid: amountToPay,
    razorpayOrderId: order.id,
    status: 'pending'
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: payment.keyId, amountToPay });
}
