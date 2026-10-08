import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAdapter } from '@/lib/adapters/payment';
import { getSupabaseAdmin } from '@/lib/supabase';
import { confirmIssueOrderByRazorpayOrderId, confirmSubscriptionOrderByRazorpayOrderId } from '@/lib/issue-payment-flow';
import { confirmContributionByOrderId } from '@/lib/article-payment-flow';

/**
 * POST /api/webhooks/razorpay — spec §6.1. This is the safety net: the order/
 * subscription/contribution normally completes via the browser's own verify
 * call right after Razorpay Checkout closes, but if the user closes the tab
 * before that fires, this webhook still confirms the payment.
 *
 * Every event is recorded in webhook_events keyed on (provider, event_id) —
 * unique constraint — so re-delivered events are skipped, not reprocessed.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';

  const payment = getPaymentAdapter();
  if (!payment.verifyWebhookSignature({ rawBody, signature })) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const body = JSON.parse(rawBody);
  const eventType: string = body.event;
  const paymentEntity = body.payload?.payment?.entity;
  const eventId = `${eventType}:${paymentEntity?.id || body.payload?.subscription?.entity?.id || body.payload?.refund?.entity?.id || Date.now()}`;

  const db = getSupabaseAdmin();
  const { data: existing } = await db.from('webhook_events').select('id').eq('provider', 'razorpay').eq('event_id', eventId).maybeSingle();
  if (existing) return NextResponse.json({ ok: true, deduped: true });

  const { data: logged } = await db
    .from('webhook_events')
    .insert({ provider: 'razorpay', event_id: eventId, event_type: eventType, payload: body, status: 'received' })
    .select('id')
    .single();

  try {
    if (eventType === 'payment.captured' && paymentEntity) {
      const razorpayOrderId = paymentEntity.order_id as string | undefined;
      const razorpayPaymentId = paymentEntity.id as string;
      if (razorpayOrderId) {
        const handled =
          (await confirmIssueOrderByRazorpayOrderId(razorpayOrderId, razorpayPaymentId)) ||
          (await confirmSubscriptionOrderByRazorpayOrderId(razorpayOrderId, razorpayPaymentId)) ||
          (await confirmContributionByOrderId(razorpayOrderId, razorpayPaymentId));
        if (!handled) {
          await db.from('webhook_events').update({ status: 'ignored' }).eq('id', logged!.id);
          return NextResponse.json({ ok: true, ignored: true });
        }
      }
    }
    // payment.failed, subscription.*, refund.* are logged for audit (webhook_events row above)
    // but don't yet have a safe automated action against the current (pre-v3) order/subscription
    // model — failures and refunds are handled by admin action today. Acting on them here is
    // deferred to the subscriptions/refunds v2 rebuild so a mis-handled webhook can't silently
    // cancel or refund something the admin didn't ask for.

    await db.from('webhook_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', logged!.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    await db
      .from('webhook_events')
      .update({ status: 'failed', error: err instanceof Error ? err.message : String(err) })
      .eq('id', logged!.id);
    // Still 200 — Razorpay would otherwise retry indefinitely for an error that re-processing won't fix.
    return NextResponse.json({ ok: false });
  }
}
