'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrderWithIssue } from '@/lib/db/orders';
import type { Invoice } from '@/lib/db/invoices';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderWithIssue | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setOrder(data.order);
        setInvoice(data.invoice);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return <p className="text-gray-500">Order not found.</p>;
  }

  if (!order) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const itemTotal = order.amount + order.couponDiscount;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/account/orders" className="text-sm text-primary">
            ← Back to Hard Copy Orders
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Order Details</h1>
        </div>
        <Badge label={order.orderStatus} />
      </div>

      <div className="rounded-xl border border-gray-200 p-5">
        <div className="mb-4 flex items-center gap-4">
          {order.issuePosterUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.issuePosterUrl} alt={order.issueTitle} className="h-20 w-16 rounded object-cover" />
          )}
          <div>
            <p className="font-semibold">{order.issueTitle}</p>
            <p className="text-sm capitalize text-gray-500">{order.format} copy</p>
          </div>
        </div>

        <Row label="Order ID" value={<span className="font-mono text-xs">{order.id}</span>} />
        <Row label="Ordered On" value={new Date(order.createdAt).toLocaleString()} />
        <Row label="Payment Status" value={<Badge label={order.paymentStatus} />} />
        {order.couponDiscount > 0 && <Row label="Item Price" value={`₹${itemTotal}`} />}
        {order.couponDiscount > 0 && <Row label="Coupon Discount" value={`− ₹${order.couponDiscount}`} />}
        <Row label="Amount Paid" value={`₹${order.amount}`} />
        {order.razorpayPaymentId && <Row label="Payment Reference" value={<span className="font-mono text-xs">{order.razorpayPaymentId}</span>} />}
      </div>

      {(order.format === 'hard' || order.format === 'both') && (
        <div className="mt-4 rounded-xl border border-gray-200 p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Delivery Address</h2>
          <p className="text-sm">{order.deliveryName}</p>
          <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
          <p className="text-sm text-gray-600">
            {order.deliveryCity}, {order.deliveryState} {order.deliveryPincode}
          </p>
          {order.deliveryPhone && <p className="text-sm text-gray-600">{order.deliveryPhone}</p>}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {invoice && (
          <Link href={`/account/payments/${invoice.id}`}>
            <Button size="sm" variant="secondary">
              View Invoice
            </Button>
          </Link>
        )}
        {order.orderStatus === 'delivered' && (
          <Link href={`/account/orders/${order.id}/return`}>
            <Button size="sm" variant="secondary">
              Request Return
            </Button>
          </Link>
        )}
        {(order.format === 'soft' || order.format === 'both') && (
          <Link href={`/issues/${order.issueId}`}>
            <Button size="sm">Read Now</Button>
          </Link>
        )}
        <Link href={`/account/help-requests/new?orderId=${order.id}`}>
          <Button size="sm" variant="secondary">
            Report a Problem
          </Button>
        </Link>
      </div>
    </div>
  );
}
