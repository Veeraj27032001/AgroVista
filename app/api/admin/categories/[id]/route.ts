import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateCategory, setCategoryActive, setCategoryDeleted } from '@/lib/db/categories';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'missing_name' }, { status: 400 });
  let category = await updateCategory(id, name);

  if (typeof body.isActive === 'boolean') {
    await setCategoryActive(id, body.isActive);
    category = { ...category, isActive: body.isActive };
  }

  return NextResponse.json({ category });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  await setCategoryDeleted(id, true);
  return NextResponse.json({ ok: true });
}
