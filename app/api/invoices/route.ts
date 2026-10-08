import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listInvoicesByEmail } from '@/lib/db/invoices';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  const invoices = await listInvoicesByEmail(session.email);
  return NextResponse.json({ invoices });
}
