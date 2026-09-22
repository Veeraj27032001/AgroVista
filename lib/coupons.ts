import 'server-only';
import { findCouponByCode, hasUserUsedCoupon } from './db/coupons';
import type { Coupon } from './types';

export type CouponValidationResult =
  | { valid: true; coupon: Coupon; discountAmount: number; finalPrice: number }
  | { valid: false; error: string; message: string };

function computeDiscount(coupon: Coupon, itemPrice: number): number {
  if (coupon.discountType === 'flat') return Math.min(coupon.discountValue, itemPrice);
  return Math.round(((coupon.discountValue / 100) * itemPrice + Number.EPSILON) * 100) / 100;
}

/** Plan §13.1 coupon validation steps. */
export async function validateCouponForPurchase(params: {
  code: string;
  userId: string;
  itemType: 'issue' | 'subscription';
  itemCouponApplicable: boolean;
  itemPrice: number;
}): Promise<CouponValidationResult> {
  const coupon = await findCouponByCode(params.code);
  if (!coupon || !coupon.isActive) {
    return { valid: false, error: 'not_found', message: 'This coupon code is not valid.' };
  }
  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date(new Date().toDateString())) {
    return { valid: false, error: 'expired', message: 'This coupon has expired.' };
  }
  if (!params.itemCouponApplicable) {
    return { valid: false, error: 'not_applicable', message: 'This coupon cannot be applied to this item.' };
  }

  const isRecurringSubscriptionCoupon = params.itemType === 'subscription' && coupon.subscriptionUsageType === 'recurring';
  if (!isRecurringSubscriptionCoupon) {
    const alreadyUsed = await hasUserUsedCoupon(params.userId, coupon.id);
    if (alreadyUsed) {
      return { valid: false, error: 'already_used', message: 'You have already used this coupon.' };
    }
  }

  const discountAmount = computeDiscount(coupon, params.itemPrice);
  return { valid: true, coupon, discountAmount, finalPrice: Math.max(0, params.itemPrice - discountAmount) };
}
