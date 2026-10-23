'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import type { OrderWithIssue } from '@/lib/db/orders';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function PurchasesPage() {
  const [orders, setOrders] = useState<OrderWithIssue[] | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState('');

  useEffect(() => {
    fetch('/api/orders', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setOrders((data.orders || []).filter((o: OrderWithIssue) => o.format === 'soft' || o.format === 'both')));
  }, []);

  async function openViewer(issueId: string, title: string) {
    const res = await fetch(`/api/download/${issueId}`, { credentials: 'include' });
    const data = await res.json();
    if (res.ok) {
      setViewerUrl(data.url);
      setViewerTitle(title);
    }
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
              <Link href={`/account/orders/${order.id}`} className="flex-1">
                <p className="font-semibold">{order.issueTitle}</p>
                <p className="text-sm capitalize text-gray-500">{order.format} copy · ₹{order.amount}</p>
              </Link>
              <div className="flex items-center gap-3">
                <Badge label={order.paymentStatus} />
                {order.paymentStatus === 'paid' && (
                  <Button size="sm" onClick={() => openViewer(order.issueId, order.issueTitle)}>
                    <Eye className="h-4 w-4" /> Read Now
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewerUrl && (
        <div className="fixed inset-0 z-[2000] flex flex-col bg-black/85">
          <div className="flex items-center justify-between p-3">
            <span className="text-sm text-white">{viewerTitle}</span>
            <Button size="sm" variant="secondary" onClick={() => setViewerUrl(null)}>
              Close
            </Button>
          </div>
          <iframe src={viewerUrl} title={viewerTitle} className="flex-1 w-full border-0" />
        </div>
      )}
    </div>
  );
}
