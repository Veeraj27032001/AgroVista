import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteCategory } from '@/lib/db/categories';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  await deleteCategory(id);
  return NextResponse.json({ ok: true });
}
