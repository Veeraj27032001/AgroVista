'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ReturnRequestWithUser } from '@/lib/db/orders';
import Table, { type Column } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequestWithUser[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/returns', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setReturns(data.returns || []));
  }, []);

  const columns: Column<ReturnRequestWithUser>[] = [
    { key: 'user', header: 'User', render: (r) => r.userEmail },
    { key: 'reason', header: 'Reason', render: (r) => <span className="line-clamp-1 max-w-xs">{r.reason}</span> },
    { key: 'date', header: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (r) => <Badge label={r.status} /> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <Link href={`/admin/returns/${r.id}`}>
          <Button size="sm" variant="secondary">
            View
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Return Requests</h1>
      <Table columns={columns} data={returns || []} loading={!returns} />
    </div>
  );
}
