'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Issue } from '@/lib/types';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<Issue[] | null>(null);

  function load() {
    fetch('/api/admin/issues', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setIssues(data.issues || []));
  }

  useEffect(load, []);

  async function handleDelete(issue: Issue) {
    const res = await fetch(`/api/admin/issues/${issue.id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      toast.error('Could not delete issue.');
      return;
    }
    load();
  }

  const columns: BsColumn<Issue>[] = [
    {
      key: 'title',
      header: 'Title',
      sortKey: 'title',
      render: (i) => (
        <span className="fw-semibold">
          {i.title}
          {i.isSpecialEdition && <span className="badge rounded-pill text-bg-warning ms-2">Special</span>}
        </span>
      )
    },
    { key: 'language', header: 'Language', sortKey: 'language', render: (i) => i.language },
    {
      key: 'status',
      header: 'Status',
      render: (i) => (
        <span className={`badge rounded-pill ${i.status === 'published' ? 'text-bg-success' : 'text-bg-secondary'}`}>{i.status}</span>
      )
    },
    {
      key: 'active',
      header: 'Active',
      render: (i) => (
        <span className={`badge rounded-pill ${i.isActive ? 'text-bg-success' : 'text-bg-secondary'}`}>{i.isActive ? 'Active' : 'Inactive'}</span>
      )
    },
    {
      key: 'actions',
      header: '',
      render: (i) => (
        <div className="text-end">
          <Link href={`/admin/issues/${i.id}`} className="btn custom-btn custom-btn-secondary custom-btn-sm me-2">
            Edit
          </Link>
          <button type="button" className="btn custom-btn-danger custom-btn-sm" onClick={() => handleDelete(i)}>
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="mb-0" style={{ fontSize: 24 }}>
          Issues
        </h1>
        <Link href="/admin/issues/new" className="btn custom-btn custom-btn-sm">
          <i className="bi bi-plus-lg me-1"></i>New Issue
        </Link>
      </div>

      <div className="admin-card">
        <BootstrapTable columns={columns} data={issues || []} loading={!issues} searchKeys={['title', 'language']} />
      </div>
    </div>
  );
}
