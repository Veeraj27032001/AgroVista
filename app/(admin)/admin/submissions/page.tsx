'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SubmissionWithUser } from '@/lib/db/submissions';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithUser[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/submissions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setSubmissions(data.submissions || []));
  }, []);

  const columns: BsColumn<SubmissionWithUser>[] = [
    { key: 'user', header: 'User', render: (s) => s.userEmail },
    { key: 'title', header: 'Title', sortKey: 'title', render: (s) => s.title },
    { key: 'language', header: 'Language', render: (s) => s.language },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    { key: 'date', header: 'Date', render: (s) => new Date(s.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <Link href={`/admin/submissions/${s.id}`} className="btn custom-btn custom-btn-secondary custom-btn-sm">
          View
        </Link>
      )
    }
  ];

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: 24 }}>
        Article Submissions
      </h1>
      <div className="admin-card">
        <BootstrapTable columns={columns} data={submissions || []} loading={!submissions} searchKeys={['userEmail', 'title']} />
      </div>
    </div>
  );
}
