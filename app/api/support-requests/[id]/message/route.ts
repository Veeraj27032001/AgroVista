import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSupportMessage, getSupportRequest, listSupportMessages } from '@/lib/db/support-requests';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const request = await getSupportRequest(id);
  if (!request) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (session.role !== 'admin' && request.userId !== session.userId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const messages = await listSupportMessages(id);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const request = await getSupportRequest(id);
  if (!request) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (session.role !== 'admin' && request.userId !== session.userId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const text = String(body.message || '').trim();
  if (!text) return NextResponse.json({ error: 'missing_message' }, { status: 400 });

  const message = await createSupportMessage(id, session.userId, session.role === 'admin', text);
  return NextResponse.json({ message });
}
