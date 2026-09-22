'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Issue } from '@/lib/types';
import Table, { type Column } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function AdminSpecialEditionsPage() {
  const [issues, setIssues] = useState<Issue[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/special-editions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setIssues(data.issues || []));
  }, []);

  const columns: Column<Issue>[] = [
    { key: 'title', header: 'Title', render: (i) => i.title },
    { key: 'status', header: 'Status', render: (i) => <Badge label={i.status} /> }
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Special Editions</h1>
        <Link href="/admin/special-editions/new">
          <Button>New Special Edition</Button>
        </Link>
      </div>
      <Table columns={columns} data={issues || []} loading={!issues} />
    </div>
  );
}
