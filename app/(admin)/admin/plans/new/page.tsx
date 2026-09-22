'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

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
      <h1 className="mb-6 text-2xl font-bold">New Subscription Plan</h1>
      <form onSubmit={handleSubmit} className="grid max-w-lg gap-4">
        <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Select
          label="Format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          options={[
            { value: 'soft', label: 'Soft Copy' },
            { value: 'hard', label: 'Hard Copy' },
            { value: 'both', label: 'Both' }
          ]}
        />
        <Select
          label="Duration"
          value={durationLabel}
          onChange={(e) => setDurationLabel(e.target.value)}
          options={DURATION_LABELS.map((d) => ({ value: d.label, label: d.label }))}
        />
        <Input label="Price (₹)" type="number" required value={price} onChange={(e) => setPrice(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={couponApplicable} onChange={(e) => setCouponApplicable(e.target.checked)} className="accent-primary" />
          Coupon applicable
        </label>
        <Button type="submit" loading={busy} className="w-fit">
          Create Plan
        </Button>
      </form>
    </div>
  );
}
