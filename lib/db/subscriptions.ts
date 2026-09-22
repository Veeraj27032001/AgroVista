import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Format, Subscription, SubscriptionPlan, SubscriptionStatus } from '@/lib/types';

// ---- subscription_plans ----

type PlanRow = {
  id: string;
  name: string;
  format: Format;
  duration_months: number;
  duration_label: string;
  price: number;
  coupon_applicable: boolean;
  is_active: boolean;
  razorpay_plan_id: string | null;
};

const toPlan = (r: PlanRow): SubscriptionPlan => ({
  id: r.id,
  name: r.name,
  format: r.format,
  durationMonths: r.duration_months,
  durationLabel: r.duration_label,
  price: Number(r.price),
  couponApplicable: r.coupon_applicable,
  isActive: r.is_active,
  razorpayPlanId: r.razorpay_plan_id
});

export async function listActivePlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('duration_months', { ascending: true });
  if (error) throw error;
  return (data as PlanRow[]).map(toPlan);
}

export async function listAllPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await getSupabaseAdmin().from('subscription_plans').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as PlanRow[]).map(toPlan);
}

export async function getPlan(id: string): Promise<SubscriptionPlan | null> {
  const { data, error } = await getSupabaseAdmin().from('subscription_plans').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toPlan(data as PlanRow) : null;
}

export async function createPlan(params: {
  name: string;
  format: Format;
  durationMonths: number;
  durationLabel: string;
  price: number;
  couponApplicable?: boolean;
}): Promise<SubscriptionPlan> {
  const { data, error } = await getSupabaseAdmin()
    .from('subscription_plans')
    .insert({
      name: params.name,
      format: params.format,
      duration_months: params.durationMonths,
      duration_label: params.durationLabel,
      price: params.price,
      coupon_applicable: params.couponApplicable ?? true
    })
    .select('*')
    .single();
  if (error) throw error;
  return toPlan(data as PlanRow);
}

export async function updatePlan(
  id: string,
  fields: Partial<{ isActive: boolean; price: number; razorpayPlanId: string }>
): Promise<SubscriptionPlan> {
  const patch: Record<string, unknown> = {};
  if (fields.isActive !== undefined) patch.is_active = fields.isActive;
  if (fields.price !== undefined) patch.price = fields.price;
  if (fields.razorpayPlanId !== undefined) patch.razorpay_plan_id = fields.razorpayPlanId;
  const { data, error } = await getSupabaseAdmin().from('subscription_plans').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return toPlan(data as PlanRow);
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('subscription_plans').delete().eq('id', id);
  if (error) throw error;
}

// ---- subscriptions ----

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  format: Format;
  start_date: string;
  end_date: string;
  amount_paid: number;
  coupon_id: string | null;
  coupon_discount: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_sub_id: string | null;
  status: SubscriptionStatus;
  auto_renew: boolean;
  created_at: string;
};

const toSubscription = (r: SubscriptionRow): Subscription => ({
  id: r.id,
  userId: r.user_id,
  planId: r.plan_id,
  format: r.format,
  startDate: r.start_date,
  endDate: r.end_date,
  amountPaid: Number(r.amount_paid),
  couponId: r.coupon_id,
  couponDiscount: Number(r.coupon_discount || 0),
  razorpayOrderId: r.razorpay_order_id,
  razorpayPaymentId: r.razorpay_payment_id,
  razorpaySubId: r.razorpay_sub_id,
  status: r.status,
  autoRenew: r.auto_renew,
  createdAt: r.created_at
});

export async function listSubscriptionsForUser(userId: string): Promise<Subscription[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SubscriptionRow[]).map(toSubscription);
}

export async function listAllSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await getSupabaseAdmin().from('subscriptions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SubscriptionRow[]).map(toSubscription);
}

export type SubscriptionWithUser = Subscription & { userEmail: string; userName: string };

export async function listAllSubscriptionsWithUser(): Promise<SubscriptionWithUser[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('subscriptions')
    .select('*, users(name, email)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as (SubscriptionRow & { users: { name: string; email: string } | null })[]).map((r) => ({
    ...toSubscription(r),
    userEmail: r.users?.email || '',
    userName: r.users?.name || ''
  }));
}

export async function getSubscription(id: string): Promise<Subscription | null> {
  const { data, error } = await getSupabaseAdmin().from('subscriptions').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toSubscription(data as SubscriptionRow) : null;
}

/** The user's current active subscription, if any (a user has at most one active plan at a time). */
export async function getActiveSubscriptionForUser(userId: string): Promise<Subscription | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toSubscription(data as SubscriptionRow) : null;
}

export async function createSubscription(params: {
  userId: string;
  planId: string;
  format: Format;
  startDate: string;
  endDate: string;
  amountPaid: number;
  couponId?: string | null;
  couponDiscount?: number;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySubId?: string | null;
  autoRenew?: boolean;
  status?: SubscriptionStatus;
}): Promise<Subscription> {
  const { data, error } = await getSupabaseAdmin()
    .from('subscriptions')
    .insert({
      user_id: params.userId,
      plan_id: params.planId,
      format: params.format,
      start_date: params.startDate,
      end_date: params.endDate,
      amount_paid: params.amountPaid,
      coupon_id: params.couponId ?? null,
      coupon_discount: params.couponDiscount ?? 0,
      razorpay_order_id: params.razorpayOrderId ?? null,
      razorpay_payment_id: params.razorpayPaymentId ?? null,
      razorpay_sub_id: params.razorpaySubId ?? null,
      auto_renew: params.autoRenew ?? false,
      status: params.status || 'pending'
    })
    .select('*')
    .single();
  if (error) throw error;
  return toSubscription(data as SubscriptionRow);
}

export async function markSubscriptionActive(id: string, paymentId: string): Promise<Subscription> {
  const { data, error } = await getSupabaseAdmin()
    .from('subscriptions')
    .update({ status: 'active', razorpay_payment_id: paymentId })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toSubscription(data as SubscriptionRow);
}

export async function findByRazorpaySubId(razorpaySubId: string): Promise<Subscription | null> {
  const { data, error } = await getSupabaseAdmin().from('subscriptions').select('*').eq('razorpay_sub_id', razorpaySubId).maybeSingle();
  if (error) throw error;
  return data ? toSubscription(data as SubscriptionRow) : null;
}

/** Extends end_date by one billing cycle after Razorpay auto-charges the mandate (webhook-driven). */
export async function extendSubscriptionByMonths(id: string, months: number): Promise<Subscription> {
  const current = await getSubscription(id);
  if (!current) throw new Error('Subscription not found');
  const newEnd = new Date(current.endDate);
  newEnd.setMonth(newEnd.getMonth() + months);
  const { data, error } = await getSupabaseAdmin()
    .from('subscriptions')
    .update({ end_date: newEnd.toISOString().slice(0, 10), status: 'active' })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toSubscription(data as SubscriptionRow);
}

export async function markSubscriptionStatus(id: string, status: SubscriptionStatus): Promise<void> {
  const { error } = await getSupabaseAdmin().from('subscriptions').update({ status }).eq('id', id);
  if (error) throw error;
}

/** Turns auto-renew off without ending current access (access still runs out at end_date). */
export async function setAutoRenew(id: string, autoRenew: boolean): Promise<void> {
  const { error } = await getSupabaseAdmin().from('subscriptions').update({ auto_renew: autoRenew }).eq('id', id);
  if (error) throw error;
}

export async function cancelSubscription(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('subscriptions').update({ status: 'cancelled' }).eq('id', id);
  if (error) throw error;
}

/** Cancels any other active subscription for this user (a user has at most one active plan — used after an upgrade activates its replacement). */
export async function cancelOtherActiveSubscriptions(userId: string, exceptId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .neq('id', exceptId);
  if (error) throw error;
}

export async function findByRazorpayOrderId(orderId: string): Promise<Subscription | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('subscriptions')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data ? toSubscription(data as SubscriptionRow) : null;
}
