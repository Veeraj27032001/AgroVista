import { NextResponse } from 'next/server';
import { listActivePlans } from '@/lib/db/subscriptions';

/** Public — powers the /subscribe page. Not in the original route table but required for it to function. */
export async function GET() {
  return NextResponse.json({ plans: await listActivePlans() });
}
