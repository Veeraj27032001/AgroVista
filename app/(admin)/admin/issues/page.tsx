'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Issue } from '@/lib/types';
import Table, { type Column } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<Issue[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/issues', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setIssues((data.issues || []).filter((i: Issue) => !i.isSpecialEdition)));
  }, []);

  const columns: Column<Issue>[] = [
    { key: 'title', header: 'Title', render: (i) => i.title },
    { key: 'language', header: 'Language', render: (i) => i.language },
    { key: 'status', header: 'Status', render: (i) => <Badge label={i.status} /> },
    {
      key: 'actions',
      header: '',
      render: (i) => (
        <Link href={`/admin/issues/${i.id}`}>
          <Button size="sm" variant="secondary">
            Edit
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues</h1>
        <Link href="/admin/issues/new">
          <Button>New Issue</Button>
        </Link>
      </div>
      <Table columns={columns} data={issues || []} loading={!issues} />
    </div>
  );
}
