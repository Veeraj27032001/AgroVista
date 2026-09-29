'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { IssueOrder, ReturnRequest } from '@/lib/types';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [order, setOrder] = useState<IssueOrder | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/admin/returns/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setReturnRequest(data.returnRequest);
        setOrder(data.order);
        if (data.order) setRefundAmount(String(data.order.amount));
      });
  }

  useEffect(load, [id]);

  async function act(action: 'reissue' | 'refund' | 'reject') {
    if (action === 'reject' && !adminNote.trim()) {
      toast.error('A reason is required to reject.');
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/returns/${id}/action`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, adminNote, refundAmount: action === 'refund' ? Number(refundAmount) : undefined })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not complete action.');
      return;
    }
    toast.success('Done');
    load();
  }

  if (!returnRequest) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div className="admin-card mx-auto" style={{ maxWidth: 520 }}>
      <h1 className="mb-4" style={{ fontSize: 24 }}>
        Return Request
      </h1>
      <div className="mb-4 p-3 rounded" style={{ background: 'var(--section-bg-color)' }}>
        <p className="mb-1">
          <strong>Reason:</strong> {returnRequest.reason}
        </p>
        <p className="mb-1">
          <strong>Status:</strong> <StatusBadge status={returnRequest.status} />
        </p>
        {order && (
          <p className="mb-0 text-muted small">
            Order amount: ₹{order.amount} · Format: {order.format}
          </p>
        )}
      </div>

      {returnRequest.status !== 'actioned' && (
        <div>
          <div className="mb-3">
            <label className="form-label">Admin note / reject reason</label>
            <textarea className="form-control" rows={4} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Refund amount (₹)</label>
            <input type="number" className="form-control" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn custom-btn" disabled={busy} onClick={() => act('reissue')}>
              {busy && <span className="btn-spinner"></span>}
              Reissue
            </button>
            <button type="button" className="btn custom-btn" disabled={busy} onClick={() => act('refund')}>
              {busy && <span className="btn-spinner"></span>}
              Refund
            </button>
            <button type="button" className="btn custom-btn-danger" disabled={busy} onClick={() => act('reject')}>
              {busy && <span className="btn-spinner"></span>}
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
