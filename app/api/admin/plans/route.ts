import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createPlan, listAllPlans } from '@/lib/db/subscriptions';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ plans: await listAllPlans() });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { name, format, durationMonths, durationLabel, price, couponApplicable } = body;
  if (!name || !format || !durationMonths || !durationLabel || price === undefined) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const plan = await createPlan({ name, format, durationMonths, durationLabel, price, couponApplicable });
  return NextResponse.json({ plan });
}
