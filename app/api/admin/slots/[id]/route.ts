import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteSlot } from '@/lib/db/catalog';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  await deleteSlot(id);
  return NextResponse.json({ ok: true });
}
