'use client';

import { use, useEffect, useState } from 'react';
import type { Invoice } from '@/lib/db/invoices';
import InvoiceView from '@/components/public/InvoiceView';

/** Bare print view — deliberately outside the admin/account route groups so there's no sidebar/nav to print along with it. */
export default function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setInvoice(data.invoice))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <p style={{ padding: 24 }}>Invoice not found, or you don&apos;t have access to it.</p>;
  if (!invoice) return null;

  return (
    <div style={{ padding: 24 }}>
      <InvoiceView invoice={invoice} autoPrint />
    </div>
  );
}
