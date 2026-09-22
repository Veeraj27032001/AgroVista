'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Category } from '@/lib/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Table, { type Column } from '@/components/ui/Table';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    fetch('/api/admin/categories', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []));
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not create category.');
      return;
    }
    setName('');
    load();
  }

  async function handleDelete(category: Category) {
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      toast.error('Could not delete category.');
      return;
    }
    load();
  }

  const columns: Column<Category>[] = [
    { key: 'name', header: 'Name', render: (c) => c.name },
    { key: 'slug', header: 'Slug', render: (c) => c.slug },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <Button size="sm" variant="danger" onClick={() => handleDelete(c)}>
          Delete
        </Button>
      )
    }
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Categories</h1>
      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <Input placeholder="e.g. Technology" value={name} onChange={(e) => setName(e.target.value)} className="w-64" />
        <Button type="submit" loading={busy}>
          Add Category
        </Button>
      </form>
      <Table columns={columns} data={categories || []} loading={!categories} />
    </div>
  );
}
