import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createMessage } from '@/lib/db/article-messages';
import { getSubmission } from '@/lib/db/submissions';

/** POST /api/submissions/[id]/message  { message } — author -> admin reply on their own submission's thread. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission || submission.userId !== session.userId) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const message = String(body.message || '').trim();
  if (!message) return NextResponse.json({ error: 'missing_message' }, { status: 400 });

  const created = await createMessage(id, 'author', message);
  return NextResponse.json({ message: created });
}
