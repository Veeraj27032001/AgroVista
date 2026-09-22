import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { actionReturnRequest, getOrder, getReturnRequest, updateOrderStatus } from '@/lib/db/orders';
import { getPaymentAdapter } from '@/lib/adapters/payment';
import type { ReturnAction } from '@/lib/types';

/**
 * POST /api/admin/returns/[id]/action  { action: 'reissue'|'refund'|'reject', adminNote?, refundAmount? }
 * Plan §15.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const returnRequest = await getReturnRequest(id);
  if (!returnRequest) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as ReturnAction;
  const adminNote = body.adminNote as string | undefined;

  if (action === 'reject') {
    const updated = await actionReturnRequest(id, { adminAction: 'reject', adminNote });
    await updateOrderStatus(returnRequest.orderId, 'delivered');
    return NextResponse.json({ returnRequest: updated });
  }

  if (action === 'reissue') {
    const updated = await actionReturnRequest(id, { adminAction: 'reissue', adminNote });
    await updateOrderStatus(returnRequest.orderId, 'reissue_initiated');
    return NextResponse.json({ returnRequest: updated });
  }

  if (action === 'refund') {
    const order = await getOrder(returnRequest.orderId);
    if (!order || !order.razorpayPaymentId) {
      return NextResponse.json({ error: 'no_payment', message: 'This order has no recorded payment to refund.' }, { status: 400 });
    }
    const refundAmount = typeof body.refundAmount === 'number' ? body.refundAmount : undefined;
    const refund = await getPaymentAdapter().createRefund({ paymentId: order.razorpayPaymentId, amountRupees: refundAmount });

    const updated = await actionReturnRequest(id, {
      adminAction: 'refund',
      adminNote,
      refundAmount: refundAmount ?? order.amount,
      razorpayRefundId: refund.id
    });
    await updateOrderStatus(returnRequest.orderId, 'refund_initiated');
    return NextResponse.json({ returnRequest: updated, refund });
  }

  return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
}
