import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-auth';
import { listStalePendingContributions, expireContribution } from '@/lib/db/article-payments';

/** J2 (spec §6.2) — article contributions still pending after 30 minutes expire; the balance they held is released automatically since expired rows aren't counted in sumSuccessfulContributions. */
export async function GET(req: NextRequest) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  const stale = await listStalePendingContributions(30);
  for (const c of stale) await expireContribution(c.id);

  return NextResponse.json({ ok: true, expiredCount: stale.length });
}
