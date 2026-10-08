'use client';

import type { Invoice } from '@/lib/db/invoices';

function money(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function InvoiceView({ invoice }: { invoice: Invoice }) {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 10px 30px rgba(32,31,23,0.08)',
        padding: 28
      }}
    >
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 style={{ fontSize: 22 }} className="mb-1">
            {invoice.type === 'credit_note' ? 'Credit Note' : 'Invoice'}
          </h1>
          <p className="font-monospace text-muted mb-0">{invoice.invoiceNumber}</p>
        </div>
        <div className="text-end">
          <p className="mb-0 small text-muted">Issued</p>
          <p className="mb-0">{new Date(invoice.issuedAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-6">
          <p className="small text-muted mb-1 text-uppercase">Billed To</p>
          <p className="mb-0 fw-semibold">{invoice.billedToName}</p>
          <p className="mb-0 small">{invoice.billedToEmail}</p>
          {invoice.billedToPhone && <p className="mb-0 small">{invoice.billedToPhone}</p>}
          {invoice.billedToGstin && <p className="mb-0 small">GSTIN: {invoice.billedToGstin}</p>}
          {invoice.billedToAddress && <p className="mb-0 small">{invoice.billedToAddress}</p>}
        </div>
      </div>

      <table className="table align-middle mb-4">
        <thead>
          <tr>
            <th>Description</th>
            <th className="text-end">Taxable Value</th>
            <th className="text-end">CGST</th>
            <th className="text-end">SGST</th>
            <th className="text-end">IGST</th>
            <th className="text-end">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line, i) => (
            <tr key={i}>
              <td>{line.description}</td>
              <td className="text-end">{money(line.taxableValuePaise)}</td>
              <td className="text-end">{line.cgstPaise ? money(line.cgstPaise) : '—'}</td>
              <td className="text-end">{line.sgstPaise ? money(line.sgstPaise) : '—'}</td>
              <td className="text-end">{line.igstPaise ? money(line.igstPaise) : '—'}</td>
              <td className="text-end">{money(line.totalPaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="d-flex justify-content-end">
        <table style={{ width: 280 }}>
          <tbody>
            <tr>
              <td className="text-muted">Taxable Total</td>
              <td className="text-end">{money(invoice.taxableTotalPaise)}</td>
            </tr>
            {invoice.cgstPaise > 0 && (
              <tr>
                <td className="text-muted">CGST</td>
                <td className="text-end">{money(invoice.cgstPaise)}</td>
              </tr>
            )}
            {invoice.sgstPaise > 0 && (
              <tr>
                <td className="text-muted">SGST</td>
                <td className="text-end">{money(invoice.sgstPaise)}</td>
              </tr>
            )}
            {invoice.igstPaise > 0 && (
              <tr>
                <td className="text-muted">IGST</td>
                <td className="text-end">{money(invoice.igstPaise)}</td>
              </tr>
            )}
            <tr style={{ borderTop: '1px solid var(--border-color)' }}>
              <td className="fw-bold pt-2">Grand Total</td>
              <td className="text-end fw-bold pt-2">{money(invoice.grandTotalPaise)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {invoice.taxableTotalPaise === invoice.grandTotalPaise && (
        <p className="text-muted small mt-4 mb-0">No GST breakout applied — tax rates have not yet been configured for this product type.</p>
      )}

      <div className="text-end mt-4 d-print-none">
        <button type="button" className="btn custom-btn custom-btn-sm" onClick={() => window.print()}>
          <i className="bi bi-printer me-1"></i>Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
