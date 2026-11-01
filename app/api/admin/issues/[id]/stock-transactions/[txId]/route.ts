import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteStockTransaction, updateStockTransaction } from '@/lib/db/stock-transactions';

/** PATCH /api/admin/issues/[id]/stock-transactions/[txId]  { quantity, note? } */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; txId: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id, txId } = await params;
  const body = await req.json().catch(() => ({}));
  const quantity = Number(body.quantity);
  if (!Number.isFinite(quantity) || quantity === 0) {
    return NextResponse.json({ error: 'invalid_quantity', message: 'Quantity must be a non-zero number.' }, { status: 400 });
  }

  try {
    const transaction = await updateStockTransaction(txId, id, quantity, body.note ? String(body.note).trim() : undefined);
    return NextResponse.json({ transaction });
  } catch (err) {
    return NextResponse.json({ error: 'failed', message: err instanceof Error ? err.message : 'Could not update transaction.' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; txId: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id, txId } = await params;
  try {
    await deleteStockTransaction(txId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'failed', message: err instanceof Error ? err.message : 'Could not delete transaction.' }, { status: 400 });
  }
}
