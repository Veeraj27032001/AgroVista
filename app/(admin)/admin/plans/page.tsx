'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { SubscriptionPlan } from '@/lib/types';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);

  function load() {
    fetch('/api/admin/plans', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setPlans(data.plans || []));
  }

  useEffect(load, []);

  async function toggleActive(plan: SubscriptionPlan) {
    const res = await fetch(`/api/admin/plans/${plan.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !plan.isActive })
    });
    if (!res.ok) {
      toast.error('Could not update plan.');
      return;
    }
    load();
  }

  const columns: BsColumn<SubscriptionPlan>[] = [
    { key: 'name', header: 'Name', sortKey: 'name', render: (p) => <span className="fw-semibold">{p.name}</span> },
    { key: 'format', header: 'Format', render: (p) => <span className="text-capitalize">{p.format}</span> },
    { key: 'duration', header: 'Duration', render: (p) => p.durationLabel },
    { key: 'price', header: 'Price', render: (p) => `₹${p.price}` },
    {
      key: 'active',
      header: 'Status',
      render: (p) => (
        <div className="d-flex align-items-center gap-2">
          <span className={`badge rounded-pill ${p.isActive ? 'text-bg-success' : 'text-bg-secondary'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
          <button
            type="button"
            className={`btn custom-btn-sm ${p.isActive ? 'custom-btn-danger' : 'custom-btn custom-btn-secondary'}`}
            onClick={() => toggleActive(p)}
          >
            {p.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="mb-0" style={{ fontSize: 24 }}>
          Subscription Plans
        </h1>
        <Link href="/admin/plans/new" className="btn custom-btn custom-btn-sm">
          <i className="bi bi-plus-lg me-1"></i>New Plan
        </Link>
      </div>

      <div className="admin-card">
        <BootstrapTable columns={columns} data={plans || []} loading={!plans} searchKeys={['name', 'format']} />
      </div>
    </div>
  );
}
