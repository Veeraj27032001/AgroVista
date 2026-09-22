import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Format, IssueOrder, OrderStatus, PaymentStatus, ReturnAction, ReturnRequest, ReturnStatus } from '@/lib/types';

// ---- issue_orders ----

type OrderRow = {
  id: string;
  user_id: string;
  issue_id: string;
  format: Format;
  amount: number;
  coupon_id: string | null;
  coupon_discount: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  delivery_name: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_pincode: string | null;
  delivery_phone: string | null;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
};

const toOrder = (r: OrderRow): IssueOrder => ({
  id: r.id,
  userId: r.user_id,
  issueId: r.issue_id,
  format: r.format,
  amount: Number(r.amount),
  couponId: r.coupon_id,
  couponDiscount: Number(r.coupon_discount || 0),
  razorpayOrderId: r.razorpay_order_id,
  razorpayPaymentId: r.razorpay_payment_id,
  deliveryName: r.delivery_name,
  deliveryAddress: r.delivery_address,
  deliveryCity: r.delivery_city,
  deliveryState: r.delivery_state,
  deliveryPincode: r.delivery_pincode,
  deliveryPhone: r.delivery_phone,
  orderStatus: r.order_status,
  paymentStatus: r.payment_status,
  createdAt: r.created_at
});

export async function listOrdersForUser(userId: string): Promise<IssueOrder[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('issue_orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(toOrder);
}

export type OrderWithIssue = IssueOrder & { issueTitle: string; issuePosterUrl: string | null };

export async function listOrdersForUserWithIssue(userId: string): Promise<OrderWithIssue[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('issue_orders')
    .select('*, issues(title, poster_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as (OrderRow & { issues: { title: string; poster_url: string | null } | null })[]).map((r) => ({
    ...toOrder(r),
    issueTitle: r.issues?.title || 'Untitled issue',
    issuePosterUrl: r.issues?.poster_url || null
  }));
}

export async function listAllOrders(status?: OrderStatus): Promise<IssueOrder[]> {
  let query = getSupabaseAdmin().from('issue_orders').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('order_status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data as OrderRow[]).map(toOrder);
}

export type AdminOrderRow = IssueOrder & { userEmail: string; issueTitle: string };

export async function listAllOrdersForAdmin(status?: OrderStatus): Promise<AdminOrderRow[]> {
  let query = getSupabaseAdmin()
    .from('issue_orders')
    .select('*, users(email), issues(title)')
    .order('created_at', { ascending: false });
  if (status) query = query.eq('order_status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data as (OrderRow & { users: { email: string } | null; issues: { title: string } | null })[]).map((r) => ({
    ...toOrder(r),
    userEmail: r.users?.email || '',
    issueTitle: r.issues?.title || 'Untitled issue'
  }));
}

export async function getOrder(id: string): Promise<IssueOrder | null> {
  const { data, error } = await getSupabaseAdmin().from('issue_orders').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toOrder(data as OrderRow) : null;
}

/** Does this user already have a paid order granting soft-copy access to this issue? */
export async function hasSoftCopyAccess(userId: string, issueId: string): Promise<boolean> {
  const { count, error } = await getSupabaseAdmin()
    .from('issue_orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('issue_id', issueId)
    .eq('payment_status', 'paid')
    .in('format', ['soft', 'both']);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function createPendingOrder(params: {
  userId: string;
  issueId: string;
  format: Format;
  amount: number;
  couponId?: string | null;
  couponDiscount?: number;
  razorpayOrderId: string;
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPincode?: string;
  deliveryPhone?: string;
}): Promise<IssueOrder> {
  const { data, error } = await getSupabaseAdmin()
    .from('issue_orders')
    .insert({
      user_id: params.userId,
      issue_id: params.issueId,
      format: params.format,
      amount: params.amount,
      coupon_id: params.couponId ?? null,
      coupon_discount: params.couponDiscount ?? 0,
      razorpay_order_id: params.razorpayOrderId,
      delivery_name: params.deliveryName || null,
      delivery_address: params.deliveryAddress || null,
      delivery_city: params.deliveryCity || null,
      delivery_state: params.deliveryState || null,
      delivery_pincode: params.deliveryPincode || null,
      delivery_phone: params.deliveryPhone || null
    })
    .select('*')
    .single();
  if (error) throw error;
  return toOrder(data as OrderRow);
}

/** Auto-created order for hard/both subscribers when an issue is published — already paid, covered by the subscription. */
export async function createSubscriptionCoveredOrder(params: {
  userId: string;
  issueId: string;
  format: 'hard' | 'both';
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPincode?: string;
  deliveryPhone?: string;
}): Promise<IssueOrder> {
  const { data, error } = await getSupabaseAdmin()
    .from('issue_orders')
    .insert({
      user_id: params.userId,
      issue_id: params.issueId,
      format: params.format,
      amount: 0,
      payment_status: 'paid',
      order_status: 'pending',
      delivery_name: params.deliveryName || null,
      delivery_address: params.deliveryAddress || null,
      delivery_city: params.deliveryCity || null,
      delivery_state: params.deliveryState || null,
      delivery_pincode: params.deliveryPincode || null,
      delivery_phone: params.deliveryPhone || null
    })
    .select('*')
    .single();
  if (error) throw error;
  return toOrder(data as OrderRow);
}

export async function findOrderByRazorpayOrderId(orderId: string): Promise<IssueOrder | null> {
  const { data, error } = await getSupabaseAdmin().from('issue_orders').select('*').eq('razorpay_order_id', orderId).maybeSingle();
  if (error) throw error;
  return data ? toOrder(data as OrderRow) : null;
}

export async function markOrderPaid(orderId: string, paymentId: string): Promise<IssueOrder> {
  const { data, error } = await getSupabaseAdmin()
    .from('issue_orders')
    .update({ payment_status: 'paid', razorpay_payment_id: paymentId })
    .eq('razorpay_order_id', orderId)
    .select('*')
    .single();
  if (error) throw error;
  return toOrder(data as OrderRow);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<IssueOrder> {
  const { data, error } = await getSupabaseAdmin().from('issue_orders').update({ order_status: status }).eq('id', id).select('*').single();
  if (error) throw error;
  return toOrder(data as OrderRow);
}

// ---- return_requests ----

type ReturnRow = {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  admin_action: ReturnAction | null;
  admin_note: string | null;
  refund_amount: number | null;
  razorpay_refund_id: string | null;
  status: ReturnStatus;
  created_at: string;
  actioned_at: string | null;
};

const toReturn = (r: ReturnRow): ReturnRequest => ({
  id: r.id,
  orderId: r.order_id,
  userId: r.user_id,
  reason: r.reason,
  adminAction: r.admin_action,
  adminNote: r.admin_note,
  refundAmount: r.refund_amount === null ? null : Number(r.refund_amount),
  razorpayRefundId: r.razorpay_refund_id,
  status: r.status,
  createdAt: r.created_at,
  actionedAt: r.actioned_at
});

export async function createReturnRequest(params: { orderId: string; userId: string; reason: string }): Promise<ReturnRequest> {
  const { data, error } = await getSupabaseAdmin()
    .from('return_requests')
    .insert({ order_id: params.orderId, user_id: params.userId, reason: params.reason })
    .select('*')
    .single();
  if (error) throw error;
  return toReturn(data as ReturnRow);
}

export async function listReturnRequests(): Promise<ReturnRequest[]> {
  const { data, error } = await getSupabaseAdmin().from('return_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ReturnRow[]).map(toReturn);
}

export type ReturnRequestWithUser = ReturnRequest & { userEmail: string };

export async function listReturnRequestsWithUser(): Promise<ReturnRequestWithUser[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('return_requests')
    .select('*, users(email)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as (ReturnRow & { users: { email: string } | null })[]).map((r) => ({ ...toReturn(r), userEmail: r.users?.email || '' }));
}

export async function getReturnRequest(id: string): Promise<ReturnRequest | null> {
  const { data, error } = await getSupabaseAdmin().from('return_requests').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toReturn(data as ReturnRow) : null;
}

export async function actionReturnRequest(
  id: string,
  params: { adminAction: ReturnAction; adminNote?: string; refundAmount?: number; razorpayRefundId?: string }
): Promise<ReturnRequest> {
  const { data, error } = await getSupabaseAdmin()
    .from('return_requests')
    .update({
      admin_action: params.adminAction,
      admin_note: params.adminNote || null,
      refund_amount: params.refundAmount ?? null,
      razorpay_refund_id: params.razorpayRefundId || null,
      status: 'actioned',
      actioned_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toReturn(data as ReturnRow);
}

// ---- cart_items ----

type CartRow = { id: string; user_id: string; issue_id: string; format: Format; added_at: string };

export async function listCartItems(userId: string): Promise<{ id: string; issueId: string; format: Format }[]> {
  const { data, error } = await getSupabaseAdmin().from('cart_items').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data as CartRow[]).map((r) => ({ id: r.id, issueId: r.issue_id, format: r.format }));
}

export async function upsertCartItem(userId: string, issueId: string, format: Format): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('cart_items')
    .upsert({ user_id: userId, issue_id: issueId, format }, { onConflict: 'user_id,issue_id' });
  if (error) throw error;
}

export async function removeCartItem(userId: string, issueId: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('cart_items').delete().eq('user_id', userId).eq('issue_id', issueId);
  if (error) throw error;
}

export async function clearCart(userId: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('cart_items').delete().eq('user_id', userId);
  if (error) throw error;
}
