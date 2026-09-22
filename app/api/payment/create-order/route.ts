import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPaymentAdapter } from '@/lib/adapters/payment';
import { getIssue } from '@/lib/db/catalog';
import { getPlan, updatePlan } from '@/lib/db/subscriptions';
import { createPendingOrder } from '@/lib/db/orders';
import { createSubscription } from '@/lib/db/subscriptions';
import { validateCouponForPurchase } from '@/lib/coupons';
import { findUserById } from '@/lib/db/users';
import { DURATION_LABEL_TO_MONTHS } from '@/lib/subscription';
import type { Format } from '@/lib/types';

const RATE_FIELD: Record<Format, 'softCopyRate' | 'hardCopyRate' | 'bothRate'> = {
  soft: 'softCopyRate',
  hard: 'hardCopyRate',
  both: 'bothRate'
};

/**
 * POST /api/payment/create-order  { type: 'issue'|'subscription', itemId, format?, couponCode? }
 * Plan §11.1 / §11.2 — one Razorpay order per issue purchase or subscription purchase.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { type, itemId, format, couponCode, autoRenew } = body as {
    type: 'issue' | 'subscription';
    itemId: string;
    format?: Format;
    couponCode?: string;
    autoRenew?: boolean;
  };

  if (!type || !itemId) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const payment = getPaymentAdapter();
  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });

  if (type === 'issue') {
    if (!format) return NextResponse.json({ error: 'missing_format' }, { status: 400 });
    const issue = await getIssue(itemId);
    if (!issue || issue.status !== 'published') return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const basePrice = issue[RATE_FIELD[format]];
    if (basePrice === null) {
      return NextResponse.json({ error: 'invalid_format', message: 'This format is not available for this issue.' }, { status: 400 });
    }

    let finalPrice = basePrice;
    let couponId: string | null = null;
    let couponDiscount = 0;
    if (couponCode) {
      const result = await validateCouponForPurchase({
        code: couponCode,
        userId: session.userId,
        itemType: 'issue',
        itemCouponApplicable: issue.couponApplicable,
        itemPrice: basePrice
      });
      if (!result.valid) return NextResponse.json(result, { status: 400 });
      finalPrice = result.finalPrice;
      couponId = result.coupon.id;
      couponDiscount = result.discountAmount;
    }

    const order = await payment.createOrder({
      amountRupees: finalPrice,
      receipt: `issue-${itemId}-${Date.now()}`,
      notes: { userId: session.userId, issueId: itemId, format }
    });

    await createPendingOrder({
      userId: session.userId,
      issueId: itemId,
      format,
      amount: finalPrice,
      couponId,
      couponDiscount,
      razorpayOrderId: order.id,
      deliveryName: user.name,
      deliveryAddress: user.address || undefined,
      deliveryCity: user.city || undefined,
      deliveryState: user.state || undefined,
      deliveryPincode: user.pincode || undefined,
      deliveryPhone: user.phone || undefined
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: payment.keyId });
  }

  // type === 'subscription'
  const plan = await getPlan(itemId);
  if (!plan || !plan.isActive) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let finalPrice = plan.price;
  let couponId: string | null = null;
  let couponDiscount = 0;
  if (couponCode) {
    const result = await validateCouponForPurchase({
      code: couponCode,
      userId: session.userId,
      itemType: 'subscription',
      itemCouponApplicable: plan.couponApplicable,
      itemPrice: plan.price
    });
    if (!result.valid) return NextResponse.json(result, { status: 400 });
    finalPrice = result.finalPrice;
    couponId = result.coupon.id;
    couponDiscount = result.discountAmount;
  }

  const months = plan.durationMonths || DURATION_LABEL_TO_MONTHS[plan.durationLabel] || 1;
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);

  if (autoRenew) {
    // Autopay: charge via a Razorpay mandate Subscription instead of a one-time Order, so
    // future cycles renew automatically without the customer re-entering payment details.
    let razorpayPlanId = plan.razorpayPlanId;
    if (!razorpayPlanId) {
      const created = await payment.createPlan({ amountRupees: finalPrice, intervalMonths: months, name: plan.name });
      razorpayPlanId = created.id;
      await updatePlan(plan.id, { razorpayPlanId });
    }

    const mandate = await payment.createMandateSubscription({
      planId: razorpayPlanId,
      totalCycles: 100,
      notes: { userId: session.userId, planId: itemId }
    });

    await createSubscription({
      userId: session.userId,
      planId: itemId,
      format: plan.format,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      amountPaid: finalPrice,
      couponId,
      couponDiscount,
      razorpaySubId: mandate.id,
      autoRenew: true,
      status: 'pending'
    });

    return NextResponse.json({ subscriptionId: mandate.id, keyId: payment.keyId, autoRenew: true });
  }

  const order = await payment.createOrder({
    amountRupees: finalPrice,
    receipt: `sub-${itemId}-${Date.now()}`,
    notes: { userId: session.userId, planId: itemId }
  });

  await createSubscription({
    userId: session.userId,
    planId: itemId,
    format: plan.format,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    amountPaid: finalPrice,
    couponId,
    couponDiscount,
    razorpayOrderId: order.id,
    autoRenew: false,
    status: 'pending'
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: payment.keyId });
}
