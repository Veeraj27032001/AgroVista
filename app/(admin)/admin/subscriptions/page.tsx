'use client';

import { useEffect, useState } from 'react';
import type { SubscriptionWithUser } from '@/lib/db/subscriptions';
import Table, { type Column } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubscriptionWithUser[] | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/admin/subscriptions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setSubs(data.subscriptions || []));
  }, []);

  const filtered = (subs || []).filter((s) => !status || s.status === status);

  const columns: Column<SubscriptionWithUser>[] = [
    { key: 'user', header: 'User', render: (s) => s.userEmail },
    { key: 'format', header: 'Format', render: (s) => <span className="capitalize">{s.format}</span> },
    { key: 'start', header: 'Start', render: (s) => s.startDate },
    { key: 'end', header: 'End', render: (s) => s.endDate },
    { key: 'status', header: 'Status', render: (s) => <Badge label={s.status} /> },
    { key: 'autoRenew', header: 'Auto-Renew', render: (s) => (s.autoRenew ? 'Yes' : 'No') }
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <Select
          placeholder="All statuses"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={['pending', 'active', 'expired', 'cancelled'].map((s) => ({ value: s, label: s }))}
          className="w-48"
        />
      </div>
      <Table columns={columns} data={filtered} loading={!subs} />
    </div>
  );
}
