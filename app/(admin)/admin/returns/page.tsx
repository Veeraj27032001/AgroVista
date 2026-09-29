'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ReturnRequestWithUser } from '@/lib/db/orders';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequestWithUser[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/returns', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setReturns(data.returns || []));
  }, []);

  const columns: BsColumn<ReturnRequestWithUser>[] = [
    { key: 'user', header: 'User', render: (r) => r.userEmail },
    { key: 'reason', header: 'Reason', render: (r) => <span className="text-truncate d-inline-block" style={{ maxWidth: 260 }}>{r.reason}</span> },
    { key: 'date', header: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <Link href={`/admin/returns/${r.id}`} className="btn custom-btn custom-btn-secondary custom-btn-sm">
          View
        </Link>
      )
    }
  ];

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: 24 }}>
        Return Requests
      </h1>
      <div className="admin-card">
        <BootstrapTable columns={columns} data={returns || []} loading={!returns} searchKeys={['userEmail', 'reason']} />
      </div>
    </div>
  );
}
