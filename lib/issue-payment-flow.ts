import 'server-only';
import { findOrderByRazorpayOrderId, markOrderPaid } from '@/lib/db/orders';
import { cancelOtherActiveSubscriptions, findByRazorpayOrderId, findByRazorpaySubId, markSubscriptionActive } from '@/lib/db/subscriptions';
import { recordCouponUsage } from '@/lib/db/coupons';
import { grantEntitlement } from '@/lib/db/entitlements';
import { getIssue } from '@/lib/db/catalog';
import { findUserById } from '@/lib/db/users';
import { recordPaymentAndIssueInvoice } from '@/lib/invoice-flow';

/**
 * Confirms a one-time issue purchase by Razorpay order id — shared by the
 * client-side verify call and the Razorpay webhook (the webhook is the
 * safety net when the browser never returns to call verify itself).
 * Returns null if no matching pending issue order is found.
 */
export async function confirmIssueOrderByRazorpayOrderId(orderId: string, paymentId: string) {
  const pending = await findOrderByRazorpayOrderId(orderId);
  if (!pending || pending.paymentStatus === 'paid') return null;

  const order = await markOrderPaid(orderId, paymentId);
  if (order.couponId) await recordCouponUsage({ couponId: order.couponId, userId: order.userId, orderId: order.id });
  if (order.format === 'soft' || order.format === 'both') {
    await grantEntitlement({ userId: order.userId, issueId: order.issueId, source: 'purchase', orderItemId: order.id });
  }

  const [user, issue] = await Promise.all([findUserById(order.userId), getIssue(order.issueId)]);
  if (user) {
    await recordPaymentAndIssueInvoice({
      userId: user.id,
      purpose: 'order',
      amountRupees: order.amount,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      productType: order.format === 'hard' ? 'print_issue' : 'digital_issue',
      description: `${issue?.title || 'Issue'} — ${order.format} copy`,
      buyerStateId: user.stateId,
      billedToName: user.name,
      billedToEmail: user.email,
      billedToPhone: user.phone || undefined,
      billedToAddress: order.deliveryAddress || undefined
    });
  }

  return { orderId: order.id, issueId: order.issueId };
}

/**
 * Confirms a one-time (non-autopay) subscription purchase by Razorpay order id.
 * Returns null if no matching pending subscription order is found.
 */
export async function confirmSubscriptionOrderByRazorpayOrderId(orderId: string, paymentId: string) {
  const pendingSub = await findByRazorpayOrderId(orderId);
  if (!pendingSub || pendingSub.status === 'active') return null;

  const sub = await markSubscriptionActive(pendingSub.id, paymentId);
  await cancelOtherActiveSubscriptions(sub.userId, sub.id);
  if (sub.couponId) await recordCouponUsage({ couponId: sub.couponId, userId: sub.userId, subId: sub.id });

  const user = await findUserById(sub.userId);
  if (user) {
    await recordPaymentAndIssueInvoice({
      userId: user.id,
      purpose: 'subscription_term',
      amountRupees: sub.amountPaid,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      productType: sub.format === 'hard' ? 'subscription_print' : 'subscription_digital',
      description: `Subscription — ${sub.format} copy`,
      buyerStateId: user.stateId,
      billedToName: user.name,
      billedToEmail: user.email,
      billedToPhone: user.phone || undefined
    });
  }

  return { subscriptionId: sub.id };
}

/** Confirms an autopay mandate's first (or renewal) charge by Razorpay subscription id. */
export async function confirmMandateChargeBySubscriptionId(razorpaySubscriptionId: string, paymentId: string) {
  const pendingSub = await findByRazorpaySubId(razorpaySubscriptionId);
  if (!pendingSub || pendingSub.status === 'active') return null;

  const sub = await markSubscriptionActive(pendingSub.id, paymentId);
  await cancelOtherActiveSubscriptions(sub.userId, sub.id);
  if (sub.couponId) await recordCouponUsage({ couponId: sub.couponId, userId: sub.userId, subId: sub.id });

  const user = await findUserById(sub.userId);
  if (user) {
    await recordPaymentAndIssueInvoice({
      userId: user.id,
      purpose: 'subscription_term',
      amountRupees: sub.amountPaid,
      razorpayPaymentId: paymentId,
      productType: sub.format === 'hard' ? 'subscription_print' : 'subscription_digital',
      description: `Subscription (Autopay) — ${sub.format} copy`,
      buyerStateId: user.stateId,
      billedToName: user.name,
      billedToEmail: user.email,
      billedToPhone: user.phone || undefined
    });
  }

  return { subscriptionId: sub.id };
}
