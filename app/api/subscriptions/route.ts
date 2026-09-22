import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listSubscriptionsForUser } from '@/lib/db/subscriptions';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  const subscriptions = await listSubscriptionsForUser(session.userId);
  return NextResponse.json({ subscriptions });
}
