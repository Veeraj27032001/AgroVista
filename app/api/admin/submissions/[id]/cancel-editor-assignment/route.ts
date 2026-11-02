import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { clearEditorAssignment, getSubmission } from '@/lib/db/submissions';
import { createMessage } from '@/lib/db/article-messages';

/** POST /api/admin/submissions/[id]/cancel-editor-assignment — admin-only override, regardless of whatever stage the author/editor loop is stuck at. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = await getSubmission(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const submission = await clearEditorAssignment(id);
  await createMessage(id, 'admin', 'Editor assignment cancelled by admin.');

  return NextResponse.json({ submission });
}
