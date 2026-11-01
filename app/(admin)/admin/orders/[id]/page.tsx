'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { OrderWithIssue, OrderStatusHistoryEntry } from '@/lib/db/orders';
import type { OrderStatus } from '@/lib/types';
import StatusBadge from '@/components/admin/StatusBadge';

const STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'out_for_delivery',
  'delivered',
  'return_requested',
  'returned',
  'refund_initiated',
  'refund_processing',
  'refund_completed',
  'refund_failed',
  'reissue_initiated',
  'new_copy_dispatched',
  'reissue_delivered'
];

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderWithIssue | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [history, setHistory] = useState<OrderStatusHistoryEntry[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/admin/orders/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setOrder(data.order);
        setUserEmail(data.userEmail || '');
        setHistory(data.history || []);
      });
  }

  useEffect(load, [id]);

  function openModal() {
    if (order) setStatus(order.orderStatus);
    setRemarks('');
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error('Remarks are required.');
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, remarks })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.message || 'Could not update status.');
      return;
    }
    toast.success('Status updated.');
    setModalOpen(false);
    load();
  }

  if (!order || !history) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-card mb-4">
        <Link href="/admin/orders" className="small text-muted d-inline-block mb-2">
          ← Back to Hard Copy Orders
        </Link>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h1 className="mb-0" style={{ fontSize: 22 }}>
            {order.issueTitle}
          </h1>
          <StatusBadge status={order.orderStatus} />
        </div>

        <div className="row g-4">
          <div className="col-md-6">
            <p className="small text-muted mb-1">Customer</p>
            <p className="mb-3">{userEmail}</p>

            <p className="small text-muted mb-1">Format / Amount</p>
            <p className="mb-3 text-capitalize">
              {order.format} copy · ₹{order.amount}
              {order.couponDiscount > 0 && ` (₹${order.couponDiscount} off)`}
            </p>

            <p className="small text-muted mb-1">Payment Status</p>
            <p className="mb-3">
              <StatusBadge status={order.paymentStatus} />
            </p>
          </div>
          <div className="col-md-6">
            <p className="small text-muted mb-1">Delivery Address</p>
            <p className="mb-1">{order.deliveryName}</p>
            <p className="mb-1 text-muted small">{order.deliveryAddress}</p>
            <p className="mb-3 text-muted small">
              {order.deliveryCity}, {order.deliveryState} {order.deliveryPincode}
              {order.deliveryPhone && ` · ${order.deliveryPhone}`}
            </p>
          </div>
        </div>

        <button type="button" className="btn custom-btn" onClick={openModal}>
          Update Status
        </button>
      </div>

      <div className="admin-card">
        <h2 className="mb-3" style={{ fontSize: 16, fontWeight: 700 }}>
          Update History
        </h2>
        {history.length === 0 ? (
          <p className="text-muted small">No status changes recorded yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="small">{new Date(h.createdAt).toLocaleString()}</td>
                    <td>
                      <StatusBadge status={h.status} />
                    </td>
                    <td className="small">{h.remarks}</td>
                    <td className="small text-muted">{h.changedByName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-card" style={{ maxWidth: 480, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 style={{ fontSize: 18 }} className="mb-0">
                Update Status
              </h3>
              <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
            </div>
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label">Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Remarks (required)</label>
                <textarea className="form-control" rows={3} required value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
              <button type="submit" className="btn custom-btn" disabled={busy || !remarks.trim()}>
                {busy && <span className="btn-spinner"></span>}
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
