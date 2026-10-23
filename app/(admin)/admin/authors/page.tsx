'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { AuthorRequestWithUser } from '@/lib/db/author-requests';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminAuthorsPage() {
  const [requests, setRequests] = useState<AuthorRequestWithUser[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    fetch('/api/admin/authors', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setRequests(data.requests || []));
  }

  useEffect(load, []);

  async function decide(id: string, decision: 'approved' | 'rejected') {
    let note: string | undefined;
    if (decision === 'rejected') {
      note = window.prompt('Reason for rejecting this request (optional):') || undefined;
    }
    setBusyId(id);
    const res = await fetch(`/api/admin/authors/${id}/action`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, note })
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message || 'Could not record decision.');
      setBusyId(null);
      return;
    }
    toast.success(decision === 'approved' ? 'Author approved.' : 'Request rejected.');
    setBusyId(null);
    load();
  }

  const columns: BsColumn<AuthorRequestWithUser>[] = [
    { key: 'user', header: 'User', render: (r) => (
      <div>
        <div className="fw-semibold">{r.userName || '—'}</div>
        <div className="text-muted small">{r.userEmail}</div>
      </div>
    ) },
    { key: 'note', header: 'Note', render: (r) => <span className="text-muted">{r.note || '—'}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'date', header: 'Requested', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn custom-btn custom-btn-primary custom-btn-sm"
              disabled={busyId === r.id}
              onClick={() => decide(r.id, 'approved')}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn custom-btn custom-btn-secondary custom-btn-sm"
              disabled={busyId === r.id}
              onClick={() => decide(r.id, 'rejected')}
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="text-muted small">{r.adminNote || '—'}</span>
        )
    }
  ];

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: 24 }}>
        Author Requests
      </h1>
      <div className="admin-card">
        <BootstrapTable columns={columns} data={requests || []} loading={!requests} searchKeys={['userName', 'userEmail', 'status']} />
      </div>
    </div>
  );
}
