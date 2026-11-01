import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrderWithIssue, listOrderStatusHistory } from '@/lib/db/orders';
import { findUserById } from '@/lib/db/users';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const order = await getOrderWithIssue(id);
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const [user, history] = await Promise.all([findUserById(order.userId), listOrderStatusHistory(id)]);
  return NextResponse.json({ order, userEmail: user?.email || '', history });
}
