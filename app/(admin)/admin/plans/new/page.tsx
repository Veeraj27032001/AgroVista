'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

const DURATION_LABELS = [
  { label: 'Quarterly', months: 3 },
  { label: 'Half Yearly', months: 6 },
  { label: 'Yearly', months: 12 },
  { label: '2 Year', months: 24 },
  { label: '5 Year', months: 60 }
];

export default function NewPlanPage() {
  const [name, setName] = useState('');
  const [format, setFormat] = useState('soft');
  const [durationLabel, setDurationLabel] = useState('Yearly');
  const [price, setPrice] = useState('');
  const [couponApplicable, setCouponApplicable] = useState(true);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const durationMonths = DURATION_LABELS.find((d) => d.label === durationLabel)?.months || 12;
    const res = await fetch('/api/admin/plans', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, format, durationMonths, durationLabel, price: Number(price), couponApplicable })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not create plan.');
      return;
    }
    window.location.href = '/admin/plans';
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="admin-card mx-auto" style={{ maxWidth: 480 }}>
        <h1 className="mb-4" style={{ fontSize: 24 }}>
          New Subscription Plan
        </h1>

        <div className="mb-3">
          <label className="form-label">Name</label>
          <input className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="mb-3">
          <label className="form-label">Format</label>
          <select className="form-select" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="soft">Soft Copy</option>
            <option value="hard">Hard Copy</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Duration</label>
          <select className="form-select" value={durationLabel} onChange={(e) => setDurationLabel(e.target.value)}>
            {DURATION_LABELS.map((d) => (
              <option key={d.label} value={d.label}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Price (₹)</label>
          <input type="number" className="form-control" required value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>

        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="plan-coupon"
            checked={couponApplicable}
            onChange={(e) => setCouponApplicable(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="plan-coupon">
            Coupon applicable
          </label>
        </div>

        <button type="submit" className="btn custom-btn" disabled={busy}>
          {busy && <span className="btn-spinner"></span>}
          Create Plan
        </button>
      </form>
    </div>
  );
}
