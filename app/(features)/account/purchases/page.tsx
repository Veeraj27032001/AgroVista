'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import type { OrderWithIssue } from '@/lib/db/orders';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function PurchasesPage() {
  const [orders, setOrders] = useState<OrderWithIssue[] | null>(null);

  useEffect(() => {
    fetch('/api/orders', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setOrders((data.orders || []).filter((o: OrderWithIssue) => o.format === 'soft' || o.format === 'both')));
  }, []);

  async function download(issueId: string) {
    const res = await fetch(`/api/download/${issueId}`, { credentials: 'include' });
    const data = await res.json();
    if (res.ok) window.open(data.url, '_blank');
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Purchases</h1>
      {!orders ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No purchases yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
              <div>
                <p className="font-semibold">{order.issueTitle}</p>
                <p className="text-sm capitalize text-gray-500">{order.format} copy · ₹{order.amount}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge label={order.paymentStatus} />
                {order.paymentStatus === 'paid' && (
                  <Button size="sm" onClick={() => download(order.issueId)}>
                    <Download className="h-4 w-4" /> Download
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
