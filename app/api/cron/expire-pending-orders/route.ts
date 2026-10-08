import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

/** J1 (spec §6.2) — pending v2 orders past expires_at -> expired; release coupon reservations. */
export async function GET(req: NextRequest) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  const db = getSupabaseAdmin();
  const { data: expired, error } = await db
    .from('orders')
    .update({ payment_status: 'expired', updated_at: new Date().toISOString() })
    .eq('payment_status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .select('id');
  if (error) throw error;

  const orderIds = (expired || []).map((o: { id: string }) => o.id);
  if (orderIds.length > 0) {
    await db.from('coupon_redemptions').update({ status: 'released' }).in('order_id', orderIds).eq('status', 'reserved');
  }

  return NextResponse.json({ ok: true, expiredCount: orderIds.length });
}
