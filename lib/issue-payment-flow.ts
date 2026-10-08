import 'server-only';
import { findOrderByRazorpayOrderId, markOrderPaid } from '@/lib/db/orders';
import { cancelOtherActiveSubscriptions, findByRazorpayOrderId, markSubscriptionActive } from '@/lib/db/subscriptions';
import { recordCouponUsage } from '@/lib/db/coupons';
import { grantEntitlement } from '@/lib/db/entitlements';

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
  return { subscriptionId: sub.id };
}
