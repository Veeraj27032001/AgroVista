import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listAllOrdersForAdmin } from '@/lib/db/orders';
import type { OrderStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status') as OrderStatus | null;
  return NextResponse.json({ orders: await listAllOrdersForAdmin(status || undefined) });
}
