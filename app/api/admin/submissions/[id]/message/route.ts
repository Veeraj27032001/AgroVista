import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createMessage, listMessagesForSubmission } from '@/lib/db/article-messages';
import { getSubmission } from '@/lib/db/submissions';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (session.role !== 'admin' && submission.userId !== session.userId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const messages = await listMessagesForSubmission(id);
  return NextResponse.json({ messages });
}

/** POST /api/admin/submissions/[id]/message  { message } — admin -> author note, stored on the thread only (no status change). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const message = String(body.message || '').trim();
  if (!message) return NextResponse.json({ error: 'missing_message' }, { status: 400 });

  const created = await createMessage(id, 'admin', message);
  return NextResponse.json({ message: created });
}
