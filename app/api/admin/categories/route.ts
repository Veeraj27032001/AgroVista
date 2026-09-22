import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createCategory, listCategories } from '@/lib/db/categories';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ categories: await listCategories() });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'missing_name' }, { status: 400 });

  const category = await createCategory(name);
  return NextResponse.json({ category });
}
