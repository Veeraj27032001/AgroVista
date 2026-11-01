import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import { setPrintStockSold, updateIssue } from '@/lib/db/catalog';
import { countPaidHardCopyPurchases } from '@/lib/db/orders';

export type StockTransaction = {
  id: string;
  issueId: string;
  quantity: number;
  note: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  issue_id: string;
  quantity: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
  users?: { name: string } | null;
};

const toTx = (r: Row): StockTransaction => ({
  id: r.id,
  issueId: r.issue_id,
  quantity: r.quantity,
  note: r.note,
  createdBy: r.created_by,
  createdByName: r.users?.name ?? null,
  createdAt: r.created_at
});

export async function listStockTransactions(issueId: string): Promise<StockTransaction[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('issue_stock_transactions')
    .select('*, users(name)')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(toTx);
}

/** Recomputes the cached issues.print_stock_total from the ledger, and reconciles print_stock_sold against real paid orders — every mutation below ends by calling this. */
async function syncIssueStockFields(issueId: string): Promise<void> {
  const db = getSupabaseAdmin();
  const [{ data: txs, error: txError }, sold] = await Promise.all([
    db.from('issue_stock_transactions').select('quantity').eq('issue_id', issueId),
    countPaidHardCopyPurchases(issueId)
  ]);
  if (txError) throw txError;
  const total = (txs ?? []).reduce((sum, r: { quantity: number }) => sum + r.quantity, 0);
  await updateIssue(issueId, { printStockTotal: Math.max(0, total) });
  await setPrintStockSold(issueId, sold);
}

/** What a transaction edit/delete is not allowed to drop the total below — copies already reserved for subscribers or sold are already spoken for. */
async function committedFloor(issueId: string): Promise<number> {
  const { data, error } = await getSupabaseAdmin()
    .from('issues')
    .select('print_stock_reserved_subs')
    .eq('id', issueId)
    .single();
  if (error) throw error;
  const sold = await countPaidHardCopyPurchases(issueId);
  return (data?.print_stock_reserved_subs ?? 0) + sold;
}

export async function addStockTransaction(params: {
  issueId: string;
  quantity: number;
  note?: string;
  createdBy: string;
}): Promise<StockTransaction> {
  if (!params.quantity) throw new Error('Quantity cannot be zero.');
  const { data, error } = await getSupabaseAdmin()
    .from('issue_stock_transactions')
    .insert({ issue_id: params.issueId, quantity: params.quantity, note: params.note || null, created_by: params.createdBy })
    .select('*')
    .single();
  if (error) throw error;
  await syncIssueStockFields(params.issueId);
  return toTx(data as Row);
}

/** Throws if the edit would drop the ledger total below what's already reserved/sold. */
export async function updateStockTransaction(id: string, issueId: string, quantity: number, note?: string): Promise<StockTransaction> {
  if (!quantity) throw new Error('Quantity cannot be zero.');
  const db = getSupabaseAdmin();
  const { data: others, error: othersError } = await db.from('issue_stock_transactions').select('quantity').eq('issue_id', issueId).neq('id', id);
  if (othersError) throw othersError;
  const otherTotal = (others ?? []).reduce((sum, r: { quantity: number }) => sum + r.quantity, 0);
  const floor = await committedFloor(issueId);
  if (otherTotal + quantity < floor) {
    throw new Error(`Cannot reduce stock below ${floor} copies — that many are already reserved or sold.`);
  }

  const { data, error } = await db
    .from('issue_stock_transactions')
    .update({ quantity, note: note ?? null })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  await syncIssueStockFields(issueId);
  return toTx(data as Row);
}

/** Throws if removing this transaction would drop the ledger total below what's already reserved/sold. */
export async function deleteStockTransaction(id: string, issueId: string): Promise<void> {
  const db = getSupabaseAdmin();
  const { data: others, error: othersError } = await db.from('issue_stock_transactions').select('quantity').eq('issue_id', issueId).neq('id', id);
  if (othersError) throw othersError;
  const otherTotal = (others ?? []).reduce((sum, r: { quantity: number }) => sum + r.quantity, 0);
  const floor = await committedFloor(issueId);
  if (otherTotal < floor) {
    throw new Error(`Cannot delete this transaction — it would drop stock below ${floor} copies already reserved or sold.`);
  }

  const { error } = await db.from('issue_stock_transactions').delete().eq('id', id);
  if (error) throw error;
  await syncIssueStockFields(issueId);
}
