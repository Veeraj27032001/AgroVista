import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listOrdersForUserWithIssue } from '@/lib/db/orders';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  const orders = await listOrdersForUserWithIssue(session.userId);
  return NextResponse.json({ orders });
}
