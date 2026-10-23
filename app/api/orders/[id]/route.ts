import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrderWithIssue } from '@/lib/db/orders';
import { findInvoiceByRazorpayPaymentId } from '@/lib/db/invoices';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const order = await getOrderWithIssue(id);
  if (!order || order.userId !== session.userId) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const invoice = order.razorpayPaymentId ? await findInvoiceByRazorpayPaymentId(order.razorpayPaymentId) : null;
  return NextResponse.json({ order, invoice });
}
