import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * One-time (non-autopay) subscriptions never flip to 'expired' on their own —
 * only the Razorpay mandate webhook does that, and only for autopay rows.
 * Without this job a lapsed subscription keeps showing as "active" in the
 * account/admin UI forever, even though hasPdfAccess's own date check already
 * stops granting new-issue access the moment end_date passes.
 */
export async function GET(req: NextRequest) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  const db = getSupabaseAdmin();
  const { data: expired, error } = await db
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .eq('auto_renew', false)
    .lt('end_date', new Date().toISOString().slice(0, 10))
    .select('id');
  if (error) throw error;

  return NextResponse.json({ ok: true, expiredCount: (expired || []).length });
}
