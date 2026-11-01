'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { AuthorRequestWithUser } from '@/lib/db/author-requests';
import type { User } from '@/lib/types';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminAuthorsPage() {
  const [requests, setRequests] = useState<AuthorRequestWithUser[] | null>(null);
  const [authors, setAuthors] = useState<User[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AuthorRequestWithUser | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  function load() {
    fetch('/api/admin/authors', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setRequests(data.requests || []));
    fetch('/api/admin/users?roles=author', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setAuthors(data.users || []));
  }

  useEffect(load, []);

  async function decide(id: string, decision: 'approved' | 'rejected', note?: string) {
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
    setRejectTarget(null);
    setRejectNote('');
    load();
  }

  async function submitReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectTarget || !rejectNote.trim()) return;
    await decide(rejectTarget.id, 'rejected', rejectNote.trim());
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
              onClick={() => {
                setRejectTarget(r);
                setRejectNote('');
              }}
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="text-muted small">{r.adminNote || '—'}</span>
        )
    }
  ];

  const authorColumns: BsColumn<User>[] = [
    { key: 'name', header: 'Name', sortKey: 'name', render: (u) => <span className="fw-semibold">{u.name}</span> },
    { key: 'email', header: 'Email', sortKey: 'email', render: (u) => u.email },
    { key: 'joined', header: 'Author Since', render: (u) => new Date(u.createdAt).toLocaleDateString() }
  ];

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: 24 }}>
        Authors
      </h1>

      <h2 className="mb-3" style={{ fontSize: 16, fontWeight: 700 }}>
        Current Authors
      </h2>
      <div className="admin-card mb-4">
        <BootstrapTable columns={authorColumns} data={authors || []} loading={!authors} searchKeys={['name', 'email']} />
      </div>

      <h2 className="mb-3" style={{ fontSize: 16, fontWeight: 700 }}>
        Author Requests
      </h2>
      <div className="admin-card">
        <BootstrapTable columns={columns} data={requests || []} loading={!requests} searchKeys={['userName', 'userEmail', 'status']} />
      </div>

      {rejectTarget && (
        <div className="admin-modal-backdrop" onClick={() => setRejectTarget(null)}>
          <div className="admin-card" style={{ maxWidth: 480, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 style={{ fontSize: 18 }} className="mb-0">
                Reject Request
              </h3>
              <button type="button" className="btn-close" onClick={() => setRejectTarget(null)}></button>
            </div>
            <p className="text-muted small mb-3">{rejectTarget.userName || rejectTarget.userEmail}</p>
            <form onSubmit={submitReject}>
              <div className="mb-3">
                <label className="form-label">Reason (required)</label>
                <textarea className="form-control" rows={3} required autoFocus value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
              </div>
              <button type="submit" className="btn custom-btn-danger" disabled={busyId === rejectTarget.id || !rejectNote.trim()}>
                {busyId === rejectTarget.id && <span className="btn-spinner"></span>}
                Reject Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
