import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-auth';
import { getSetting } from '@/lib/db/settings';
import { listSubmissionsPastPaymentDeadline, listSubmissionsWithUpcomingDeadline, markSubmissionPaymentExpired } from '@/lib/db/submissions';
import { notifyPaymentExpired, notifyPaymentReminder } from '@/lib/article-notifications';

/** J5 (spec §6.2) — daily 9:00 IST: reminders at deadline-7/-2 days; past deadline -> payment_expired. */
export async function GET(req: NextRequest) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  const reminderDays = await getSetting<number[]>('article_reminder_days_before', [7, 2]);

  let remindersSent = 0;
  for (const daysBefore of reminderDays) {
    const submissions = await listSubmissionsWithUpcomingDeadline(daysBefore);
    for (const s of submissions) {
      await notifyPaymentReminder(s, daysBefore);
      remindersSent++;
    }
  }

  const expiredSubmissions = await listSubmissionsPastPaymentDeadline();
  for (const s of expiredSubmissions) {
    const updated = await markSubmissionPaymentExpired(s.id);
    await notifyPaymentExpired(updated);
  }

  return NextResponse.json({ ok: true, remindersSent, expiredCount: expiredSubmissions.length });
}
