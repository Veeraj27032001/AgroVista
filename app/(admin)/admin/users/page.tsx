'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/users', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []));
  }, []);

  const columns: BsColumn<User>[] = [
    { key: 'name', header: 'Name', sortKey: 'name', render: (u) => <span className="fw-semibold">{u.name}</span> },
    { key: 'email', header: 'Email', sortKey: 'email', render: (u) => u.email },
    { key: 'phone', header: 'Phone', render: (u) => u.phone || '—' },
    { key: 'city', header: 'City', render: (u) => u.city || '—' },
    { key: 'role', header: 'Role', render: (u) => <span className="text-capitalize">{u.role}</span> },
    { key: 'joined', header: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString() }
  ];

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: 24 }}>
        Users
      </h1>
      <div className="admin-card">
        <BootstrapTable columns={columns} data={users || []} loading={!users} searchKeys={['name', 'email', 'phone', 'city']} />
      </div>
    </div>
  );
}
