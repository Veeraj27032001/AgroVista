import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { validateCouponForPurchase } from '@/lib/coupons';
import { getIssue } from '@/lib/db/catalog';
import { getPlan } from '@/lib/db/subscriptions';
import type { Format } from '@/lib/types';

const RATE_FIELD: Record<Format, 'softCopyRate' | 'hardCopyRate' | 'bothRate'> = {
  soft: 'softCopyRate',
  hard: 'hardCopyRate',
  both: 'bothRate'
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { code, itemType, itemId, format } = body as { code: string; itemType: 'issue' | 'subscription'; itemId: string; format?: Format };

  if (!code || !itemType || !itemId) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  let itemPrice: number | null = null;
  let couponApplicable = true;

  if (itemType === 'issue') {
    const issue = await getIssue(itemId);
    if (!issue) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    itemPrice = format ? issue[RATE_FIELD[format]] : null;
    couponApplicable = issue.couponApplicable;
  } else {
    const plan = await getPlan(itemId);
    if (!plan) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    itemPrice = plan.price;
    couponApplicable = plan.couponApplicable;
  }

  if (itemPrice === null) {
    return NextResponse.json({ error: 'invalid_format', message: 'This format is not available for this item.' }, { status: 400 });
  }

  const result = await validateCouponForPurchase({
    code,
    userId: session.userId,
    itemType,
    itemCouponApplicable: couponApplicable,
    itemPrice
  });

  if (!result.valid) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
