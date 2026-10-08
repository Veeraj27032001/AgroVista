'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Invoice } from '@/lib/db/invoices';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/invoices', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setInvoices(data.invoices || []));
  }, []);

  const columns: BsColumn<Invoice>[] = [
    { key: 'number', header: 'Invoice #', sortKey: 'invoiceNumber', render: (i) => <span className="font-monospace">{i.invoiceNumber}</span> },
    {
      key: 'type',
      header: 'Type',
      render: (i) => (
        <span className={`badge rounded-pill ${i.type === 'credit_note' ? 'text-bg-danger' : 'text-bg-success'}`}>
          {i.type.replace('_', ' ')}
        </span>
      )
    },
    { key: 'billedTo', header: 'Billed To', render: (i) => i.billedToName || i.billedToEmail || '—' },
    { key: 'date', header: 'Date', render: (i) => new Date(i.issuedAt).toLocaleDateString() },
    { key: 'amount', header: 'Amount', render: (i) => `₹${(i.grandTotalPaise / 100).toFixed(2)}` },
    {
      key: 'actions',
      header: '',
      render: (i) => (
        <Link href={`/admin/invoices/${i.id}`} className="btn custom-btn custom-btn-secondary custom-btn-sm">
          View
        </Link>
      )
    }
  ];

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: 24 }}>
        Refunds & Invoices
      </h1>
      <div className="admin-card">
        <BootstrapTable columns={columns} data={invoices || []} loading={!invoices} searchKeys={['invoiceNumber', 'billedToName', 'billedToEmail']} />
      </div>
    </div>
  );
}
