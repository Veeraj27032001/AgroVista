'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Coupon } from '@/lib/types';
import Table, { type Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);

  function load() {
    fetch('/api/admin/coupons', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setCoupons(data.coupons || []));
  }

  useEffect(load, []);

  async function toggle(coupon: Coupon) {
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !coupon.isActive })
    });
    if (!res.ok) {
      toast.error('Could not update coupon.');
      return;
    }
    load();
  }

  const columns: Column<Coupon>[] = [
    { key: 'code', header: 'Code', render: (c) => c.code },
    { key: 'type', header: 'Type', render: (c) => c.discountType },
    { key: 'value', header: 'Value', render: (c) => (c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`) },
    { key: 'usage', header: 'Sub. Usage', render: (c) => c.subscriptionUsageType || '—' },
    { key: 'expiry', header: 'Expiry', render: (c) => c.expiryDate || 'Never' },
    {
      key: 'active',
      header: 'Active',
      render: (c) => (
        <Button size="sm" variant={c.isActive ? 'secondary' : 'primary'} onClick={() => toggle(c)}>
          {c.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      )
    }
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Link href="/admin/coupons/new">
          <Button>New Coupon</Button>
        </Link>
      </div>
      <Table columns={columns} data={coupons || []} loading={!coupons} />
    </div>
  );
}
