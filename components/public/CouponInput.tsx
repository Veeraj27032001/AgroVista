'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import type { Format } from '@/lib/types';

export type AppliedCoupon = { code: string; discountAmount: number; finalPrice: number };

export default function CouponInput({
  itemType,
  itemId,
  format,
  onApplied
}: {
  itemType: 'issue' | 'subscription';
  itemId: string;
  format?: Format;
  onApplied: (applied: AppliedCoupon | null) => void;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState('');

  async function apply() {
    if (!code.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), itemType, itemId, format })
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(data.message || 'Invalid coupon.');
        setApplied(null);
        onApplied(null);
        return;
      }
      const result = { code: code.trim().toUpperCase(), discountAmount: data.discountAmount, finalPrice: data.finalPrice };
      setApplied(result);
      onApplied(result);
      toast.success(`Coupon applied — ₹${data.discountAmount} off`);
    } catch {
      setError('Could not validate coupon.');
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setApplied(null);
    setCode('');
    setError('');
    onApplied(null);
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-primary-light px-3 py-2 text-sm">
        <span>
          Coupon <strong>{applied.code}</strong> applied — ₹{applied.discountAmount} off
        </span>
        <button onClick={clear} className="text-xs font-semibold text-primary underline">
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button type="button" variant="secondary" loading={busy} onClick={apply}>
          Apply
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
