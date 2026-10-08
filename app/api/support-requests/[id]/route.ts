import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupportRequest } from '@/lib/db/support-requests';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const request = await getSupportRequest(id);
  if (!request) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (session.role !== 'admin' && request.userId !== session.userId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  return NextResponse.json({ request });
}
