'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { AdminOrderRow } from '@/lib/db/orders';
import type { OrderStatus } from '@/lib/types';
import Table, { type Column } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';

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

  async function updateStatus(order: AdminOrderRow, status: OrderStatus) {
    const res = await fetch(`/api/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      toast.error('Could not update status.');
      return;
    }
    load();
  }

  const columns: Column<AdminOrderRow>[] = [
    { key: 'user', header: 'User', render: (o) => o.userEmail },
    { key: 'issue', header: 'Issue', render: (o) => o.issueTitle },
    { key: 'format', header: 'Format', render: (o) => <span className="capitalize">{o.format}</span> },
    { key: 'amount', header: 'Amount', render: (o) => `₹${o.amount}` },
    { key: 'status', header: 'Status', render: (o) => <Badge label={o.orderStatus} /> },
    {
      key: 'update',
      header: 'Update',
      render: (o) => (
        <Select
          value=""
          placeholder="Change status"
          onChange={(e) => e.target.value && updateStatus(o, e.target.value as OrderStatus)}
          options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
          className="w-44"
        />
      )
    }
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Select placeholder="All statuses" value={filter} onChange={(e) => setFilter(e.target.value)} options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} className="w-48" />
      </div>
      <Table columns={columns} data={orders || []} loading={!orders} />
    </div>
  );
}
