import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { assignEditor, getSubmission } from '@/lib/db/submissions';
import { createMessage } from '@/lib/db/article-messages';
import { findUserById } from '@/lib/db/users';
import { notifyEditorAssigned } from '@/lib/article-notifications';

/** POST /api/admin/submissions/[id]/assign-editor  { editorId, remarks } — admin-only hand-off to a specific editor. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = await getSubmission(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const editorId = String(body.editorId || '');
  const remarks = String(body.remarks || '').trim();
  if (!editorId) return NextResponse.json({ error: 'missing_editor' }, { status: 400 });
  if (!remarks) return NextResponse.json({ error: 'missing_remarks', message: 'Remarks are required when forwarding to an editor.' }, { status: 400 });

  const editor = await findUserById(editorId);
  if (!editor || editor.role !== 'editor') return NextResponse.json({ error: 'invalid_editor' }, { status: 400 });

  const submission = await assignEditor(id, editorId);
  await createMessage(id, 'admin', `Forwarded to editor ${editor.name}: ${remarks}`);
  await notifyEditorAssigned(editor.email, editor.name, submission.title, remarks);

  return NextResponse.json({ submission });
}
