'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function NewCouponPage() {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('flat');
  const [discountValue, setDiscountValue] = useState('');
  const [subscriptionUsageType, setSubscriptionUsageType] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        discountType,
        discountValue: Number(discountValue),
        subscriptionUsageType: subscriptionUsageType || undefined,
        expiryDate: expiryDate || undefined
      })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not create coupon.');
      return;
    }
    window.location.href = '/admin/coupons';
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="admin-card mx-auto" style={{ maxWidth: 520 }}>
        <h1 className="mb-4" style={{ fontSize: 24 }}>
          New Coupon
        </h1>
        <div className="mb-3">
          <label className="form-label">Code</label>
          <input className="form-control" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </div>

        <div className="mb-3">
          <label className="form-label">Discount Type</label>
          <select className="form-select" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
            <option value="flat">Flat (₹)</option>
            <option value="percent">Percent (%)</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Discount Value</label>
          <input type="number" className="form-control" required value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
        </div>

        <div className="mb-3">
          <label className="form-label">Subscription Usage Type</label>
          <select className="form-select" value={subscriptionUsageType} onChange={(e) => setSubscriptionUsageType(e.target.value)}>
            <option value="">Issues only (not for subscriptions)</option>
            <option value="one_time">One-time</option>
            <option value="recurring">Recurring (every renewal)</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Expiry Date</label>
          <input type="date" className="form-control" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>

        <button type="submit" className="btn custom-btn" disabled={busy}>
          {busy && <span className="btn-spinner"></span>}
          Create Coupon
        </button>
      </form>
    </div>
  );
}
