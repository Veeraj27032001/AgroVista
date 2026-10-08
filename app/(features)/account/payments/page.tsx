'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Invoice } from '@/lib/db/invoices';
import Spinner from '@/components/ui/Spinner';

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);

  useEffect(() => {
    fetch('/api/invoices', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setInvoices(data.invoices || []));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Payments & Invoices</h1>
      {!invoices ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : invoices.length === 0 ? (
        <p className="text-gray-500">No payments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Invoice #', 'Type', 'Date', 'Amount', ''].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono">{inv.invoiceNumber}</td>
                  <td className="whitespace-nowrap px-4 py-3 capitalize">{inv.type.replace('_', ' ')}</td>
                  <td className="whitespace-nowrap px-4 py-3">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                  <td className="whitespace-nowrap px-4 py-3">₹{(inv.grandTotalPaise / 100).toFixed(2)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/account/payments/${inv.id}`} className="text-primary underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
