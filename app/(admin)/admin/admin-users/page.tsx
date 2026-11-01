'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { User } from '@/lib/types';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';

export default function AdminAdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    fetch('/api/admin/users?roles=admin,editor', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []));
  }

  useEffect(load, []);

  async function addEditor(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.message || 'Could not create editor account.');
      return;
    }
    toast.success('Editor account created — credentials emailed to them.');
    setName('');
    setEmail('');
    setPassword('');
    setShowForm(false);
    load();
  }

  const columns: BsColumn<User>[] = [
    { key: 'name', header: 'Name', sortKey: 'name', render: (u) => <span className="fw-semibold">{u.name}</span> },
    { key: 'email', header: 'Email', sortKey: 'email', render: (u) => u.email },
    { key: 'role', header: 'Role', render: (u) => <span className="badge rounded-pill text-bg-secondary text-capitalize">{u.role}</span> },
    { key: 'joined', header: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString() }
  ];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="mb-0" style={{ fontSize: 24 }}>
          Admin Users
        </h1>
        <button type="button" className="btn custom-btn custom-btn-sm" onClick={() => setShowForm((v) => !v)}>
          <i className="bi bi-plus-lg me-1"></i>Add Editor
        </button>
      </div>

      {showForm && (
        <form onSubmit={addEditor} className="admin-card mb-4">
          <h2 className="mb-3" style={{ fontSize: 16, fontWeight: 700 }}>
            New Editor Account
          </h2>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">Name</label>
              <input className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Password</label>
              <input className="form-control" type="text" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="form-text">At least 8 characters. Emailed to the editor.</div>
            </div>
          </div>
          <button type="submit" className="btn custom-btn" disabled={busy}>
            {busy && <span className="btn-spinner"></span>}
            Create Editor
          </button>
        </form>
      )}

      <div className="admin-card">
        <BootstrapTable columns={columns} data={users || []} loading={!users} searchKeys={['name', 'email']} />
      </div>
    </div>
  );
}
