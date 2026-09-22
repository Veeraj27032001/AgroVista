'use client';

import { use, useState } from 'react';
import toast from 'react-hot-toast';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

export default function RequestReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/orders/${id}/return`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.message || 'Could not submit return request.');
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Return requested</h1>
        <p className="mt-2 text-gray-600">We&apos;ll review your request and update the order status shortly.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Request a Return</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea label="Reason for return" required value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button type="submit" loading={busy}>
          Submit Return Request
        </Button>
      </form>
    </div>
  );
}
