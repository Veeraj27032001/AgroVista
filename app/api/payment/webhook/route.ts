import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAdapter } from '@/lib/adapters/payment';
import { extendSubscriptionByMonths, findByRazorpaySubId, markSubscriptionStatus } from '@/lib/db/subscriptions';
import { getPlan } from '@/lib/db/subscriptions';
import { DURATION_LABEL_TO_MONTHS } from '@/lib/subscription';

/**
 * POST /api/payment/webhook — Razorpay server-to-server events for autopay mandates.
 * Configure in Razorpay Dashboard > Settings > Webhooks, subscribed to:
 * subscription.charged, subscription.cancelled, subscription.halted, subscription.completed.
 * Reads the raw body text (needed for signature verification — must hash the exact bytes sent).
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-razorpay-signature') || '';
  const rawBody = await req.text();

  const payment = getPaymentAdapter();
  if (!payment.verifyWebhookSignature({ rawBody, signature })) {
    console.warn('Rejected Razorpay webhook with invalid signature');
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const event = payload.event as string;
  const subEntity = payload.payload?.subscription?.entity;
  const razorpaySubId = subEntity?.id;

  if (razorpaySubId && (event === 'subscription.charged' || event === 'subscription.cancelled' || event === 'subscription.halted' || event === 'subscription.completed')) {
    const sub = await findByRazorpaySubId(razorpaySubId);
    if (sub) {
      if (event === 'subscription.charged') {
        const plan = await getPlan(sub.planId);
        const months = plan?.durationMonths || (plan ? DURATION_LABEL_TO_MONTHS[plan.durationLabel] : undefined) || 1;
        await extendSubscriptionByMonths(sub.id, months);
        console.log(`Webhook: renewed subscription ${sub.id} by ${months} month(s)`);
      } else {
        // cancelled | halted | completed — mandate stopped, no more auto-charges.
        await markSubscriptionStatus(sub.id, event === 'subscription.completed' ? 'expired' : 'cancelled');
        console.log(`Webhook: subscription ${sub.id} set to ${event === 'subscription.completed' ? 'expired' : 'cancelled'} (${event})`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
