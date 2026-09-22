'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

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
      <h1 className="mb-6 text-2xl font-bold">New Coupon</h1>
      <form onSubmit={handleSubmit} className="grid max-w-lg gap-4">
        <Input label="Code" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <Select
          label="Discount Type"
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value)}
          options={[
            { value: 'flat', label: 'Flat (₹)' },
            { value: 'percent', label: 'Percent (%)' }
          ]}
        />
        <Input label="Discount Value" type="number" required value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
        <Select
          label="Subscription Usage Type"
          placeholder="Issues only (not for subscriptions)"
          value={subscriptionUsageType}
          onChange={(e) => setSubscriptionUsageType(e.target.value)}
          options={[
            { value: 'one_time', label: 'One-time' },
            { value: 'recurring', label: 'Recurring (every renewal)' }
          ]}
        />
        <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        <Button type="submit" loading={busy} className="w-fit">
          Create Coupon
        </Button>
      </form>
    </div>
  );
}
