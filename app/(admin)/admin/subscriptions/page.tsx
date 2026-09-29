'use client';

import { useEffect, useState } from 'react';
import type { SubscriptionWithUser } from '@/lib/db/subscriptions';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubscriptionWithUser[] | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/admin/subscriptions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setSubs(data.subscriptions || []));
  }, []);

  const filtered = (subs || []).filter((s) => !status || s.status === status);

  const columns: BsColumn<SubscriptionWithUser>[] = [
    { key: 'user', header: 'User', render: (s) => s.userEmail },
    { key: 'format', header: 'Format', render: (s) => <span className="text-capitalize">{s.format}</span> },
    { key: 'start', header: 'Start', render: (s) => s.startDate },
    { key: 'end', header: 'End', render: (s) => s.endDate },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    { key: 'autoRenew', header: 'Auto-Renew', render: (s) => (s.autoRenew ? 'Yes' : 'No') }
  ];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="mb-0" style={{ fontSize: 24 }}>
          Subscriptions
        </h1>
        <select className="form-select" style={{ width: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['pending', 'active', 'expired', 'cancelled'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-card">
        <BootstrapTable columns={columns} data={filtered} loading={!subs} searchKeys={['userEmail', 'format']} />
      </div>
    </div>
  );
}
