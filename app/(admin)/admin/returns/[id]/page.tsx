'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { IssueOrder, ReturnRequest } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';

export default function AdminReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [order, setOrder] = useState<IssueOrder | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/admin/returns/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setReturnRequest(data.returnRequest);
        setOrder(data.order);
        if (data.order) setRefundAmount(String(data.order.amount));
      });
  }

  useEffect(load, [id]);

  async function act(action: 'reissue' | 'refund' | 'reject') {
    if (action === 'reject' && !adminNote.trim()) {
      toast.error('A reason is required to reject.');
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/returns/${id}/action`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, adminNote, refundAmount: action === 'refund' ? Number(refundAmount) : undefined })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not complete action.');
      return;
    }
    toast.success('Done');
    load();
  }

  if (!returnRequest) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-bold">Return Request</h1>
      <div className="mb-4 rounded-xl border border-gray-200 p-4">
        <p>
          <strong>Reason:</strong> {returnRequest.reason}
        </p>
        <p className="mt-1">
          <strong>Status:</strong> <Badge label={returnRequest.status} />
        </p>
        {order && (
          <p className="mt-1 text-sm text-gray-500">
            Order amount: ₹{order.amount} · Format: {order.format}
          </p>
        )}
      </div>

      {returnRequest.status !== 'actioned' && (
        <div className="space-y-4">
          <Textarea label="Admin note / reject reason" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
          <Input label="Refund amount (₹)" type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
          <div className="flex gap-3">
            <Button loading={busy} onClick={() => act('reissue')}>
              Reissue
            </Button>
            <Button loading={busy} onClick={() => act('refund')}>
              Refund
            </Button>
            <Button loading={busy} variant="danger" onClick={() => act('reject')}>
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
