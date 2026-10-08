'use client';

import { use, useEffect, useState } from 'react';
import type { Invoice } from '@/lib/db/invoices';
import InvoiceView from '@/components/public/InvoiceView';

export default function AdminInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetch(`/api/invoices/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setInvoice(data.invoice));
  }, [id]);

  if (!invoice) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return <InvoiceView invoice={invoice} />;
}
