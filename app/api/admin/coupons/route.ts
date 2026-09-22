import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createCoupon, listCoupons } from '@/lib/db/coupons';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ coupons: await listCoupons() });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { code, discountType, discountValue, subscriptionUsageType, expiryDate } = body;
  if (!code || !discountType || discountValue === undefined) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const coupon = await createCoupon({ code, discountType, discountValue, subscriptionUsageType, expiryDate });
  return NextResponse.json({ coupon });
}
