import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllSettings, setSetting } from '@/lib/db/settings';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ settings: await getAllSettings() });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { key, value } = body as { key?: string; value?: unknown };
  if (!key) return NextResponse.json({ error: 'missing_key' }, { status: 400 });

  await setSetting(key, value);
  return NextResponse.json({ ok: true });
}
