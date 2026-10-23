import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupportRequest } from '@/lib/db/support-requests';
import { getSupportAttachmentSignedUrl } from '@/lib/storage';

/** GET /api/support-requests/[id]/attachment?index=N — signs one of the request's uploaded photos for viewing. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const request = await getSupportRequest(id);
  if (!request) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (session.role !== 'admin' && request.userId !== session.userId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const index = Number(req.nextUrl.searchParams.get('index'));
  const key = request.attachmentKeys[index];
  if (!key) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const url = await getSupportAttachmentSignedUrl(key);
  return NextResponse.redirect(url);
}
