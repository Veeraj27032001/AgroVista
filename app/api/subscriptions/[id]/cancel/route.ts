import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubscription, setAutoRenew } from '@/lib/db/subscriptions';
import { getPaymentAdapter } from '@/lib/adapters/payment';

/**
 * POST /api/subscriptions/[id]/cancel — turns off auto-renew and cancels the Razorpay
 * mandate if autopay was on. Current access is untouched; it simply won't renew past end_date.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const sub = await getSubscription(id);
  if (!sub || sub.userId !== session.userId) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (sub.razorpaySubId) {
    await getPaymentAdapter().cancelMandateSubscription(sub.razorpaySubId);
  }
  await setAutoRenew(id, false);

  return NextResponse.json({ ok: true });
}
