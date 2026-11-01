'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { AdminOrderRow } from '@/lib/db/orders';
import type { OrderStatus } from '@/lib/types';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[] | null>(null);
  const [filter, setFilter] = useState('');

  function load() {
    const qs = filter ? `?status=${filter}` : '';
    fetch(`/api/admin/orders${qs}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []));
  }

  useEffect(load, [filter]);

  const columns: BsColumn<AdminOrderRow>[] = [
    { key: 'user', header: 'User', render: (o) => o.userEmail },
    { key: 'issue', header: 'Issue', render: (o) => o.issueTitle },
    { key: 'format', header: 'Format', render: (o) => <span className="text-capitalize">{o.format}</span> },
    { key: 'amount', header: 'Amount', render: (o) => `₹${o.amount}` },
    { key: 'status', header: 'Hard Copy Status', render: (o) => <StatusBadge status={o.orderStatus} /> },
    {
      key: 'actions',
      header: '',
      render: (o) => (
        <Link href={`/admin/orders/${o.id}`} className="btn custom-btn custom-btn-secondary custom-btn-sm">
          View
        </Link>
      )
    }
  ];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="mb-0" style={{ fontSize: 24 }}>
          Hard Copy Orders
        </h1>
        <select className="form-select" style={{ width: 200 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-card">
        <BootstrapTable columns={columns} data={orders || []} loading={!orders} searchKeys={['userEmail', 'issueTitle']} />
      </div>
    </div>
  );
}
