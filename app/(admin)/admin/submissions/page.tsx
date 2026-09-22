'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SubmissionWithUser } from '@/lib/db/submissions';
import Table, { type Column } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithUser[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/submissions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setSubmissions(data.submissions || []));
  }, []);

  const columns: Column<SubmissionWithUser>[] = [
    { key: 'user', header: 'User', render: (s) => s.userEmail },
    { key: 'title', header: 'Title', render: (s) => s.title },
    { key: 'language', header: 'Language', render: (s) => s.language },
    { key: 'status', header: 'Status', render: (s) => <Badge label={s.status} /> },
    { key: 'date', header: 'Date', render: (s) => new Date(s.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <Link href={`/admin/submissions/${s.id}`}>
          <Button size="sm" variant="secondary">
            View
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Article Submissions</h1>
      <Table columns={columns} data={submissions || []} loading={!submissions} />
    </div>
  );
}
