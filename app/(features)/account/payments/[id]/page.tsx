'use client';

import { use, useEffect, useState } from 'react';
import type { Invoice } from '@/lib/db/invoices';
import InvoiceView from '@/components/public/InvoiceView';
import Spinner from '@/components/ui/Spinner';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetch(`/api/invoices/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setInvoice(data.invoice));
  }, [id]);

  if (!invoice) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return <InvoiceView invoice={invoice} />;
}
