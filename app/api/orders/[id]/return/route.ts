import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrder, updateOrderStatus } from '@/lib/db/orders';
import { createReturnRequest } from '@/lib/db/orders';

/**
 * POST /api/orders/[id]/return  { reason }
 * Plan §15 — order must be delivered and include a hard copy.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const order = await getOrder(id);
  if (!order || order.userId !== session.userId) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (order.orderStatus !== 'delivered') {
    return NextResponse.json({ error: 'not_delivered', message: 'Only delivered orders can be returned.' }, { status: 400 });
  }
  if (order.format === 'soft') {
    return NextResponse.json({ error: 'not_returnable', message: 'Soft-copy-only orders cannot be returned.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason || '').trim();
  if (!reason) return NextResponse.json({ error: 'missing_reason' }, { status: 400 });

  const returnRequest = await createReturnRequest({ orderId: order.id, userId: session.userId, reason });
  await updateOrderStatus(order.id, 'return_requested');

  return NextResponse.json({ returnRequest });
}
