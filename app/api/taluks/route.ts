import { NextRequest, NextResponse } from 'next/server';
import { listTaluks } from '@/lib/db/locations';

export async function GET(req: NextRequest) {
  const districtId = req.nextUrl.searchParams.get('districtId');
  if (!districtId) return NextResponse.json({ error: 'missing_district_id' }, { status: 400 });
  return NextResponse.json({ taluks: await listTaluks(districtId) });
}
