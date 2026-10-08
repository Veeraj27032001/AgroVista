import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubmission, scheduleSubmission } from '@/lib/db/submissions';
import { notifyScheduled } from '@/lib/article-notifications';

/** POST /api/admin/submissions/[id]/schedule  { volumeNumber, issueNumber, publicationMonth, publicationYear, pageRange } */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = await getSubmission(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (existing.status !== 'payment_completed') {
    return NextResponse.json({ error: 'not_payment_completed', message: 'Payment must be completed before scheduling.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { volumeNumber, issueNumber, publicationMonth, publicationYear, pageRange } = body as Record<string, unknown>;
  if (!volumeNumber || !issueNumber || !publicationMonth || !publicationYear) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const submission = await scheduleSubmission(id, {
    volumeNumber: Number(volumeNumber),
    issueNumber: Number(issueNumber),
    publicationMonth: Number(publicationMonth),
    publicationYear: Number(publicationYear),
    pageRange: pageRange ? String(pageRange) : undefined
  });
  await notifyScheduled(submission);
  return NextResponse.json({ submission });
}
