'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { SubscriptionPlan } from '@/lib/types';
import Table, { type Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';

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

  const columns: Column<SubscriptionPlan>[] = [
    { key: 'name', header: 'Name', render: (p) => p.name },
    { key: 'format', header: 'Format', render: (p) => <span className="capitalize">{p.format}</span> },
    { key: 'duration', header: 'Duration', render: (p) => p.durationLabel },
    { key: 'price', header: 'Price', render: (p) => `₹${p.price}` },
    {
      key: 'active',
      header: 'Active',
      render: (p) => (
        <Button size="sm" variant={p.isActive ? 'secondary' : 'primary'} onClick={() => toggleActive(p)}>
          {p.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      )
    }
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <Link href="/admin/plans/new">
          <Button>New Plan</Button>
        </Link>
      </div>
      <Table columns={columns} data={plans || []} loading={!plans} />
    </div>
  );
}
