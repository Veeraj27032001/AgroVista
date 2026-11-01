'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Issue } from '@/lib/types';
import type { StockTransaction } from '@/lib/db/stock-transactions';

export default function IssueStockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [transactions, setTransactions] = useState<StockTransaction[] | null>(null);
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/admin/issues/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setIssue(data.issue));
    fetch(`/api/admin/issues/${id}/stock-transactions`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setTransactions(data.transactions || []));
  }

  useEffect(load, [id]);

  function resetForm() {
    setQuantity('');
    setNote('');
    setEditingId(null);
  }

  function startEdit(tx: StockTransaction) {
    setEditingId(tx.id);
    setQuantity(String(tx.quantity));
    setNote(tx.note || '');
  }

  async function submit() {
    const q = Number(quantity);
    if (!q) {
      toast.error('Quantity cannot be zero.');
      return;
    }
    setBusy(true);
    const url = editingId ? `/api/admin/issues/${id}/stock-transactions/${editingId}` : `/api/admin/issues/${id}/stock-transactions`;
    const res = await fetch(url, {
      method: editingId ? 'PATCH' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: q, note })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.message || 'Could not save transaction.');
      return;
    }
    toast.success(editingId ? 'Transaction updated.' : 'Stock added.');
    resetForm();
    load();
  }

  async function remove(txId: string) {
    if (!window.confirm('Delete this stock transaction?')) return;
    const res = await fetch(`/api/admin/issues/${id}/stock-transactions/${txId}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message || 'Could not delete transaction.');
      return;
    }
    toast.success('Deleted.');
    load();
  }

  if (!issue || !transactions) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  const available = Math.max(0, issue.printStockTotal - issue.printStockReservedSubs - issue.printStockSold);

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="admin-card mb-4">
          <Link href={`/admin/issues/${id}`} className="small text-muted d-inline-block mb-2">
            ← Back to {issue.title}
          </Link>
          <h1 className="mb-3" style={{ fontSize: 22 }}>
            Hard Copy Stock
          </h1>

          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="border rounded p-3 text-center">
                <div className="fs-4 fw-bold">{issue.printStockTotal}</div>
                <div className="small text-muted">Total Printed</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="border rounded p-3 text-center">
                <div className="fs-4 fw-bold">{issue.printStockReservedSubs}</div>
                <div className="small text-muted">Reserved (Subs)</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="border rounded p-3 text-center">
                <div className="fs-4 fw-bold">{issue.printStockSold}</div>
                <div className="small text-muted">Sold</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="border rounded p-3 text-center">
                <div className={`fs-4 fw-bold ${available === 0 ? 'text-danger' : ''}`}>{available}</div>
                <div className="small text-muted">Available</div>
              </div>
            </div>
          </div>

          <h2 className="mb-2" style={{ fontSize: 16, fontWeight: 700 }}>
            Transactions
          </h2>
          {transactions.length === 0 ? (
            <p className="text-muted small">No stock added yet — this issue currently has 0 copies.</p>
          ) : (
            <div className="table-responsive mb-3">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Qty</th>
                    <th>Note</th>
                    <th>By</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="small">{new Date(t.createdAt).toLocaleString()}</td>
                      <td className={t.quantity < 0 ? 'text-danger' : 'text-success'}>
                        {t.quantity > 0 ? '+' : ''}
                        {t.quantity}
                      </td>
                      <td className="small text-muted">{t.note || '—'}</td>
                      <td className="small text-muted">{t.createdByName || '—'}</td>
                      <td className="text-end">
                        <button type="button" className="btn custom-btn custom-btn-secondary custom-btn-sm me-2" onClick={() => startEdit(t)}>
                          Edit
                        </button>
                        <button type="button" className="btn custom-btn-danger custom-btn-sm" onClick={() => remove(t.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="mb-2" style={{ fontSize: 16, fontWeight: 700 }}>
            {editingId ? 'Edit Transaction' : 'Add Stock'}
          </h2>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Quantity</label>
              <input
                className="form-control"
                type="number"
                placeholder="e.g. 500 or -10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <div className="form-text">Positive to add copies, negative to correct/remove copies.</div>
            </div>
            <div className="col-md-8">
              <label className="form-label">Note</label>
              <input className="form-control" placeholder="e.g. First print run, 2nd batch, damaged copies written off…" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button type="button" className="btn custom-btn" disabled={busy || !quantity} onClick={submit}>
              {editingId ? 'Save Changes' : 'Add Transaction'}
            </button>
            {editingId && (
              <button type="button" className="btn custom-btn custom-btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
