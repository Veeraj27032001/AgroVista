import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Coupon, CouponUsageType, DiscountType } from '@/lib/types';

type CouponRow = {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  subscription_usage_type: CouponUsageType | null;
  expiry_date: string | null;
  is_active: boolean;
};

const toCoupon = (r: CouponRow): Coupon => ({
  id: r.id,
  code: r.code,
  discountType: r.discount_type,
  discountValue: Number(r.discount_value),
  subscriptionUsageType: r.subscription_usage_type,
  expiryDate: r.expiry_date,
  isActive: r.is_active
});

export async function listCoupons(): Promise<Coupon[]> {
  const { data, error } = await getSupabaseAdmin().from('coupons').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CouponRow[]).map(toCoupon);
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data ? toCoupon(data as CouponRow) : null;
}

export async function createCoupon(params: {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  subscriptionUsageType?: CouponUsageType;
  expiryDate?: string;
}): Promise<Coupon> {
  const { data, error } = await getSupabaseAdmin()
    .from('coupons')
    .insert({
      code: params.code.toUpperCase(),
      discount_type: params.discountType,
      discount_value: params.discountValue,
      subscription_usage_type: params.subscriptionUsageType || null,
      expiry_date: params.expiryDate || null
    })
    .select('*')
    .single();
  if (error) throw error;
  return toCoupon(data as CouponRow);
}

export async function updateCoupon(id: string, fields: Partial<{ isActive: boolean }>): Promise<Coupon> {
  const { data, error } = await getSupabaseAdmin()
    .from('coupons')
    .update({ is_active: fields.isActive })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toCoupon(data as CouponRow);
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('coupons').delete().eq('id', id);
  if (error) throw error;
}

export async function hasUserUsedCoupon(userId: string, couponId: string): Promise<boolean> {
  const { count, error } = await getSupabaseAdmin()
    .from('coupon_usages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('coupon_id', couponId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function recordCouponUsage(params: {
  couponId: string;
  userId: string;
  orderId?: string;
  subId?: string;
}): Promise<void> {
  const { error } = await getSupabaseAdmin().from('coupon_usages').insert({
    coupon_id: params.couponId,
    user_id: params.userId,
    order_id: params.orderId || null,
    sub_id: params.subId || null
  });
  if (error) throw error;
}
