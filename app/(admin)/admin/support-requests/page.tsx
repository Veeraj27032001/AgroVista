'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SupportRequestWithUser } from '@/lib/db/support-requests';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminSupportRequestsPage() {
  const [requests, setRequests] = useState<SupportRequestWithUser[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/support-requests', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setRequests(data.requests || []));
  }, []);

  const columns: BsColumn<SupportRequestWithUser>[] = [
    { key: 'number', header: 'Request #', sortKey: 'requestNumber', render: (r) => <span className="fw-semibold">{r.requestNumber}</span> },
    { key: 'user', header: 'User', render: (r) => r.userEmail },
    { key: 'type', header: 'Type', render: (r) => r.type.replace(/_/g, ' ') },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'date', header: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <Link href={`/admin/support-requests/${r.id}`} className="btn custom-btn custom-btn-secondary custom-btn-sm">
          View
        </Link>
      )
    }
  ];

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: 24 }}>
        Help Requests
      </h1>
      <div className="admin-card">
        <BootstrapTable columns={columns} data={requests || []} loading={!requests} searchKeys={['requestNumber', 'userEmail', 'type']} />
      </div>
    </div>
  );
}
