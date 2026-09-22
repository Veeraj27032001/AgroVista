import { NextRequest, NextResponse } from 'next/server';
import { listVolumesForYear } from '@/lib/db/catalog';

export async function GET(req: NextRequest) {
  const yearId = req.nextUrl.searchParams.get('yearId');
  if (!yearId) return NextResponse.json({ error: 'missing_year_id' }, { status: 400 });
  return NextResponse.json({ volumes: await listVolumesForYear(yearId) });
}
