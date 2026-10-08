import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSiteContentMap, setSiteContentBulk } from '@/lib/db/site-content';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ content: await getSiteContentMap() });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const entries = Object.entries(body.content || {}).map(([key, value]) => ({ key, value: String(value) }));
  await setSiteContentBulk(entries);
  return NextResponse.json({ ok: true });
}
