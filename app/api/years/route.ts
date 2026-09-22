import { NextResponse } from 'next/server';
import { listYears } from '@/lib/db/catalog';

export async function GET() {
  return NextResponse.json({ years: await listYears() });
}
