'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrderWithIssue } from '@/lib/db/orders';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithIssue[] | null>(null);

  useEffect(() => {
    fetch('/api/orders', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setOrders((data.orders || []).filter((o: OrderWithIssue) => o.format === 'hard' || o.format === 'both')));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Hard Copy Orders</h1>
      {!orders ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No hard copy orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
              <div>
                <p className="font-semibold">{order.issueTitle}</p>
                <p className="text-sm text-gray-500">
                  {order.deliveryAddress}, {order.deliveryCity} {order.deliveryPincode}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge label={order.orderStatus} />
                {order.orderStatus === 'delivered' && (
                  <Link href={`/account/orders/${order.id}/return`}>
                    <Button size="sm" variant="secondary">
                      Request Return
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
