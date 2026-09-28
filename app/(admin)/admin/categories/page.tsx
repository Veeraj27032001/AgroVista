'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Category } from '@/lib/types';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch('/api/admin/categories', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []));
  }

  useEffect(load, []);

  function openAdd() {
    setEditing(null);
    setName('');
    setIsActive(true);
    setModalOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setIsActive(category.isActive);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = editing
      ? await fetch(`/api/admin/categories/${editing.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, isActive })
        })
      : await fetch('/api/admin/categories', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
    setBusy(false);
    if (!res.ok) {
      toast.error(editing ? 'Could not update category.' : 'Could not create category.');
      return;
    }
    setModalOpen(false);
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

  const columns: BsColumn<Category>[] = [
    { key: 'name', header: 'Name', sortKey: 'name', render: (c) => <span className="fw-semibold">{c.name}</span> },
    { key: 'slug', header: 'Slug', sortKey: 'slug', render: (c) => <span className="text-muted">{c.slug}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <span className={`badge rounded-pill ${c.isActive ? 'text-bg-success' : 'text-bg-secondary'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
      )
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div className="text-end">
          <button type="button" className="btn custom-btn custom-btn-secondary custom-btn-sm me-2" onClick={() => openEdit(c)}>
            Edit
          </button>
          <button type="button" className="btn custom-btn-danger custom-btn-sm" onClick={() => handleDelete(c)}>
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
          Categories
        </h1>
        <button type="button" className="btn custom-btn custom-btn-sm" onClick={openAdd}>
          <i className="bi bi-plus-lg me-1"></i>Add Category
        </button>
      </div>

      <div className="admin-card">
        <BootstrapTable columns={columns} data={categories || []} loading={!categories} searchKeys={['name', 'slug']} />
      </div>

      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-card" style={{ maxWidth: 420, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 style={{ fontSize: 18 }} className="mb-0">
                {editing ? 'Edit Category' : 'Add Category'}
              </h3>
              <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input className="form-control" placeholder="e.g. Technology" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              {editing && (
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="category-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="category-active">
                    Active
                  </label>
                </div>
              )}
              <button type="submit" className="btn custom-btn" disabled={busy}>
                {busy && <span className="btn-spinner"></span>}
                {editing ? 'Save Changes' : 'Add Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
