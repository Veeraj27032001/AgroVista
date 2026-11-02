import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubmission } from '@/lib/db/submissions';
import { forwardEditorRound, getActiveEditorRound } from '@/lib/db/submission-editor-rounds';
import { createMessage } from '@/lib/db/article-messages';
import { notifySubmissionForwardedToAdmin } from '@/lib/article-notifications';

/** POST /api/admin/submissions/[id]/forward-to-admin  { remarks?, hasAttachment } — the assigned editor signals their round is ready for admin review. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'editor') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = await getSubmission(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const activeRound = await getActiveEditorRound(id);
  if (!activeRound || activeRound.editorId !== session.userId) {
    return NextResponse.json({ error: 'not_assigned', message: 'This submission is not assigned to you.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const remarks = String(body.remarks || '').trim();
  const hasAttachment = Boolean(body.hasAttachment);

  const round = await forwardEditorRound(activeRound.id, id, hasAttachment, remarks);
  await createMessage(
    id,
    'editor',
    remarks ? `Forwarded to admin: ${remarks}` : hasAttachment ? 'Forwarded to admin with the edited file.' : 'Forwarded to admin — no file attached.'
  );
  await notifySubmissionForwardedToAdmin(existing.title);

  return NextResponse.json({ round });
}
