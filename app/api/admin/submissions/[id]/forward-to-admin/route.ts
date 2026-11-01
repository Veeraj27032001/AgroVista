import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { forwardToAdmin, getSubmission } from '@/lib/db/submissions';
import { createMessage } from '@/lib/db/article-messages';
import { notifySubmissionForwardedToAdmin } from '@/lib/article-notifications';

/** POST /api/admin/submissions/[id]/forward-to-admin  { remarks? } — the assigned editor signals their edit is ready for admin review. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'editor') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = await getSubmission(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (existing.assignedEditorId !== session.userId) {
    return NextResponse.json({ error: 'not_assigned', message: 'This submission is not assigned to you.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const remarks = String(body.remarks || '').trim();

  const submission = await forwardToAdmin(id);
  await createMessage(id, 'editor', remarks ? `Forwarded to admin: ${remarks}` : 'Forwarded to admin — edit ready for review.');
  await notifySubmissionForwardedToAdmin(submission.title);

  return NextResponse.json({ submission });
}
