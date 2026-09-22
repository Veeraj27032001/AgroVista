import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createYear, listYears } from '@/lib/db/catalog';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ years: await listYears() });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const year = parseInt(body.year, 10);
  if (!Number.isInteger(year)) return NextResponse.json({ error: 'invalid_year' }, { status: 400 });

  const created = await createYear(year);
  return NextResponse.json({ year: created });
}
