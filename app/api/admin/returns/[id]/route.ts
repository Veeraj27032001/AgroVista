import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrder, getReturnRequest } from '@/lib/db/orders';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const returnRequest = await getReturnRequest(id);
  if (!returnRequest) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const order = await getOrder(returnRequest.orderId);
  return NextResponse.json({ returnRequest, order });
}
