import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteIssue, getIssue, updateIssue } from '@/lib/db/catalog';
import { autoDeliverToHardCopySubscribers } from '@/lib/subscription';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = await getIssue(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const updated = await updateIssue(id, body);
  if (existing.status === 'draft' && updated.status === 'published') await autoDeliverToHardCopySubscribers(updated);
  return NextResponse.json({ issue: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  await deleteIssue(id);
  return NextResponse.json({ ok: true });
}
