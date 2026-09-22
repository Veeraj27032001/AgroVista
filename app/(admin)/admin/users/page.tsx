'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import Table, { type Column } from '@/components/ui/Table';
import Input from '@/components/ui/Input';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/users', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []));
  }, []);

  const filtered = (users || []).filter(
    (u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name', render: (u) => u.name },
    { key: 'email', header: 'Email', render: (u) => u.email },
    { key: 'phone', header: 'Phone', render: (u) => u.phone || '—' },
    { key: 'city', header: 'City', render: (u) => u.city || '—' },
    { key: 'role', header: 'Role', render: (u) => <span className="capitalize">{u.role}</span> },
    { key: 'joined', header: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString() }
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
      </div>
      <Table columns={columns} data={filtered} loading={!users} />
    </div>
  );
}
