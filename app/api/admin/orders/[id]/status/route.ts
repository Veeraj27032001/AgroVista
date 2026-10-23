import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrder, updateOrderStatus } from '@/lib/db/orders';
import type { OrderStatus } from '@/lib/types';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body.status as OrderStatus;
  if (!status) return NextResponse.json({ error: 'missing_status' }, { status: 400 });

  const existing = await getOrder(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (existing.format === 'soft') {
    return NextResponse.json({ error: 'no_fulfillment', message: 'Soft-copy orders have no physical delivery status to update.' }, { status: 400 });
  }

  const order = await updateOrderStatus(id, status);
  return NextResponse.json({ order });
}
