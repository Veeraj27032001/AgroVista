import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listAllSubscriptionsWithUser } from '@/lib/db/subscriptions';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ subscriptions: await listAllSubscriptionsWithUser() });
}
