import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateSubmissionStatus } from '@/lib/db/submissions';
import { notifyUnderReview } from '@/lib/article-notifications';

/** POST /api/admin/submissions/[id]/hold — keeps the submission open under review without a final decision. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const submission = await updateSubmissionStatus(id, 'under_review');
  await notifyUnderReview(submission);
  return NextResponse.json({ submission });
}
