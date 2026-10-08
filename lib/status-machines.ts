/**
 * Status machines from AgriOxen_Functional_Specification.md §4. Each entity's
 * allowed transitions are listed explicitly — nothing outside this map is a
 * legal status change. `canTransition` is the single place that enforces
 * that, so every future call site (routes, jobs, webhooks) shares one source
 * of truth instead of re-deriving the rules.
 */

export type OrderPaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'partially_refunded' | 'refunded';
export type ShipmentStatus = 'awaiting_dispatch' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'delivery_failed' | 'returned_to_sender';
export type SubscriptionStatusV2 = 'pending_payment' | 'active' | 'abandoned' | 'payment_failed' | 'non_renewing' | 'ended' | 'cancelled';
export type SupportRequestStatus = 'open' | 'in_review' | 'approved' | 'rejected' | 'resolved' | 'closed';
export type ArticleSubmissionStatusV2 =
  | 'submitted'
  | 'under_review'
  | 'revision_requested'
  | 'resubmitted'
  | 'on_hold'
  | 'rejected'
  | 'accepted_payment_pending'
  | 'partially_paid'
  | 'payment_expired'
  | 'paid'
  | 'scheduled'
  | 'published'
  | 'withdrawn';

const ORDER_PAYMENT_TRANSITIONS: Record<OrderPaymentStatus, OrderPaymentStatus[]> = {
  pending: ['paid', 'failed', 'expired'],
  failed: ['pending'],
  expired: [],
  paid: ['partially_refunded', 'refunded'],
  partially_refunded: ['refunded'],
  refunded: []
};

const SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  awaiting_dispatch: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'delivery_failed'],
  delivered: [],
  cancelled: [],
  delivery_failed: ['returned_to_sender'],
  returned_to_sender: [] // admin reships (new replacement shipment) or refunds instead of transitioning this row further
};

const SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatusV2, SubscriptionStatusV2[]> = {
  pending_payment: ['active', 'abandoned'],
  abandoned: [],
  active: ['ended', 'payment_failed', 'non_renewing', 'cancelled'],
  payment_failed: ['active', 'ended'],
  non_renewing: ['ended', 'active', 'cancelled'],
  ended: [],
  cancelled: []
};

const SUPPORT_REQUEST_TRANSITIONS: Record<SupportRequestStatus, SupportRequestStatus[]> = {
  open: ['in_review', 'closed'],
  in_review: ['approved', 'rejected', 'closed'],
  approved: ['resolved'],
  rejected: ['closed'],
  resolved: ['closed'],
  closed: []
};

const ARTICLE_SUBMISSION_TRANSITIONS: Record<ArticleSubmissionStatusV2, ArticleSubmissionStatusV2[]> = {
  submitted: ['under_review', 'withdrawn'],
  under_review: ['revision_requested', 'on_hold', 'rejected', 'accepted_payment_pending', 'withdrawn'],
  revision_requested: ['resubmitted', 'withdrawn'],
  resubmitted: ['under_review', 'withdrawn'],
  on_hold: ['under_review', 'withdrawn'],
  rejected: [],
  accepted_payment_pending: ['partially_paid', 'paid', 'payment_expired'],
  partially_paid: ['paid', 'payment_expired'],
  payment_expired: ['accepted_payment_pending', 'rejected'],
  paid: ['scheduled'],
  scheduled: ['published'],
  published: [],
  withdrawn: []
};

function canTransition<T extends string>(table: Record<T, T[]>, from: T, to: T): boolean {
  return table[from]?.includes(to) ?? false;
}

export const canTransitionOrderPayment = (from: OrderPaymentStatus, to: OrderPaymentStatus) =>
  canTransition(ORDER_PAYMENT_TRANSITIONS, from, to);

export const canTransitionShipment = (from: ShipmentStatus, to: ShipmentStatus) => canTransition(SHIPMENT_TRANSITIONS, from, to);

export const canTransitionSubscriptionV2 = (from: SubscriptionStatusV2, to: SubscriptionStatusV2) =>
  canTransition(SUBSCRIPTION_TRANSITIONS, from, to);

export const canTransitionSupportRequest = (from: SupportRequestStatus, to: SupportRequestStatus) =>
  canTransition(SUPPORT_REQUEST_TRANSITIONS, from, to);

export const canTransitionArticleSubmissionV2 = (from: ArticleSubmissionStatusV2, to: ArticleSubmissionStatusV2) =>
  canTransition(ARTICLE_SUBMISSION_TRANSITIONS, from, to);

export const ORDER_DISPLAY_STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'Awaiting payment',
  payment_failed: 'Payment failed',
  expired: 'Expired',
  refunded: 'Refunded',
  completed: 'Completed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed_print_cancelled: 'Completed (print cancelled)',
  cancelled: 'Cancelled'
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatusV2, string> = {
  pending_payment: 'Awaiting payment',
  active: 'Active',
  abandoned: 'Abandoned',
  payment_failed: 'Payment failed — update payment',
  non_renewing: 'Active — ending soon',
  ended: 'Ended',
  cancelled: 'Cancelled'
};
