import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createVolume, listVolumesForYear } from '@/lib/db/catalog';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const yearId = req.nextUrl.searchParams.get('yearId');
  if (!yearId) return NextResponse.json({ error: 'missing_year_id' }, { status: 400 });
  return NextResponse.json({ volumes: await listVolumesForYear(yearId) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { yearId, volumeNumber, name, quarter, startMonth, endMonth } = body;
  if (!yearId || !volumeNumber) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const volume = await createVolume({ yearId, volumeNumber, name, quarter, startMonth, endMonth });
  return NextResponse.json({ volume });
}
