import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getIssue } from '@/lib/db/catalog';
import { addStockTransaction, listStockTransactions } from '@/lib/db/stock-transactions';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  return NextResponse.json({ transactions: await listStockTransactions(id) });
}

/** POST /api/admin/issues/[id]/stock-transactions  { quantity, note? } — quantity can be negative (a correction). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const quantity = Number(body.quantity);
  if (!Number.isFinite(quantity) || quantity === 0) {
    return NextResponse.json({ error: 'invalid_quantity', message: 'Quantity must be a non-zero number.' }, { status: 400 });
  }

  try {
    const transaction = await addStockTransaction({
      issueId: id,
      quantity,
      note: body.note ? String(body.note).trim() : undefined,
      createdBy: session.userId
    });
    return NextResponse.json({ transaction });
  } catch (err) {
    return NextResponse.json({ error: 'failed', message: err instanceof Error ? err.message : 'Could not add transaction.' }, { status: 400 });
  }
}
