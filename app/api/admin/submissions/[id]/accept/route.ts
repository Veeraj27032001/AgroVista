import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { acceptSubmission } from '@/lib/db/submissions';
import { notifyAccepted } from '@/lib/article-notifications';
import { getSetting } from '@/lib/db/settings';

/** POST /api/admin/submissions/[id]/accept  { publicationCharge } */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const publicationCharge = Number(body.publicationCharge);
  if (!publicationCharge || publicationCharge <= 0) {
    return NextResponse.json({ error: 'missing_charge', message: 'A publication charge amount is required.' }, { status: 400 });
  }

  const deadlineDays = await getSetting('article_payment_deadline_days', 15);
  const submission = await acceptSubmission(id, publicationCharge, deadlineDays);
  await notifyAccepted(submission);
  return NextResponse.json({ submission });
}
