import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getInvoice } from '@/lib/db/invoices';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (session.role !== 'admin' && invoice.billedToEmail !== session.email) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  return NextResponse.json({ invoice });
}
