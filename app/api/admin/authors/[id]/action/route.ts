import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { actionAuthorRequest, getAuthorRequest } from '@/lib/db/author-requests';
import { findUserById, updateUserRole } from '@/lib/db/users';
import { notifyAuthorRequestApproved, notifyAuthorRequestRejected } from '@/lib/author-notifications';

/** POST /api/admin/authors/[id]/action  { decision: 'approved' | 'rejected', note? } */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = await getAuthorRequest(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (existing.status !== 'pending') {
    return NextResponse.json({ error: 'already_decided' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const decision = body.decision === 'approved' ? 'approved' : body.decision === 'rejected' ? 'rejected' : null;
  if (!decision) return NextResponse.json({ error: 'invalid_decision' }, { status: 400 });
  const note = String(body.note || '').trim() || undefined;
  if (decision === 'rejected' && !note) {
    return NextResponse.json({ error: 'missing_note', message: 'Remarks are required when rejecting a request.' }, { status: 400 });
  }

  const updated = await actionAuthorRequest(id, decision, session.userId, note);
  const user = await findUserById(existing.userId);

  if (decision === 'approved') {
    await updateUserRole(existing.userId, 'author');
    if (user) await notifyAuthorRequestApproved(user.email, user.name);
  } else if (user) {
    await notifyAuthorRequestRejected(user.email, user.name, note);
  }

  return NextResponse.json({ request: updated });
}
