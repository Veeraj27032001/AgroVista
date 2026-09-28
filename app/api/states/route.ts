import { NextResponse } from 'next/server';
import { listStates } from '@/lib/db/locations';

export async function GET() {
  return NextResponse.json({ states: await listStates() });
}
