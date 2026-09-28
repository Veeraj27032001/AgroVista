'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Coupon } from '@/lib/types';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';

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

  const columns: BsColumn<Coupon>[] = [
    { key: 'code', header: 'Code', sortKey: 'code', render: (c) => <span className="fw-semibold">{c.code}</span> },
    { key: 'type', header: 'Type', sortKey: 'discountType', render: (c) => c.discountType },
    { key: 'value', header: 'Value', render: (c) => (c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`) },
    { key: 'usage', header: 'Sub. Usage', render: (c) => c.subscriptionUsageType || '—' },
    { key: 'expiry', header: 'Expiry', render: (c) => c.expiryDate || 'Never' },
    {
      key: 'active',
      header: 'Status',
      render: (c) => (
        <div className="d-flex align-items-center gap-2">
          <span className={`badge rounded-pill ${c.isActive ? 'text-bg-success' : 'text-bg-secondary'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
          <button
            type="button"
            className={`btn custom-btn-sm ${c.isActive ? 'custom-btn-danger' : 'custom-btn custom-btn-secondary'}`}
            onClick={() => toggle(c)}
          >
            {c.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="mb-0" style={{ fontSize: 24 }}>
          Coupons
        </h1>
        <Link href="/admin/coupons/new" className="btn custom-btn custom-btn-sm">
          <i className="bi bi-plus-lg me-1"></i>New Coupon
        </Link>
      </div>

      <div className="admin-card">
        <BootstrapTable columns={columns} data={coupons || []} loading={!coupons} searchKeys={['code', 'discountType']} />
      </div>
    </div>
  );
}
