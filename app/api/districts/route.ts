import { NextRequest, NextResponse } from 'next/server';
import { listDistricts } from '@/lib/db/locations';

export async function GET(req: NextRequest) {
  const stateId = req.nextUrl.searchParams.get('stateId');
  if (!stateId) return NextResponse.json({ error: 'missing_state_id' }, { status: 400 });
  return NextResponse.json({ districts: await listDistricts(stateId) });
}
