import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAuthorRequest, getLatestAuthorRequestForUser } from '@/lib/db/author-requests';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  const request = await getLatestAuthorRequestForUser(session.userId);
  return NextResponse.json({ request });
}

/** POST /api/author-requests  { note? } — a plain user asks to become an Author. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  if (session.role === 'author' || session.role === 'admin') {
    return NextResponse.json({ error: 'already_author', message: 'You can already submit articles.' }, { status: 400 });
  }

  const existing = await getLatestAuthorRequestForUser(session.userId);
  if (existing && existing.status === 'pending') {
    return NextResponse.json({ error: 'already_pending', request: existing }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const note = String(body.note || '').trim();
  const request = await createAuthorRequest(session.userId, note || undefined);
  return NextResponse.json({ request });
}
