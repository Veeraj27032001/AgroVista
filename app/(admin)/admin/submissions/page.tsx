'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { SubmissionWithUser } from '@/lib/db/submissions';
import type { SubmissionStatus } from '@/lib/types';
import BootstrapTable, { type BsColumn } from '@/components/admin/BootstrapTable';
import StatusBadge from '@/components/admin/StatusBadge';

const STAT_CARDS: { label: string; statuses: SubmissionStatus[] }[] = [
  { label: 'Total Articles', statuses: [] },
  { label: 'New Submissions', statuses: ['submitted'] },
  { label: 'Under Review', statuses: ['under_review', 'resubmitted'] },
  { label: 'Revision Required', statuses: ['revision_required'] },
  { label: 'Accepted', statuses: ['accepted'] },
  { label: 'Rejected', statuses: ['rejected'] },
  { label: 'Payment Pending', statuses: ['payment_pending'] },
  { label: 'Partially Paid', statuses: ['partially_paid'] },
  { label: 'Payment Completed', statuses: ['payment_completed'] },
  { label: 'Published', statuses: ['published'] }
];

const FILTERS: { label: string; value: SubmissionStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'New', value: 'submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Revision', value: 'revision_required' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Payment Pending', value: 'payment_pending' },
  { label: 'Partially Paid', value: 'partially_paid' },
  { label: 'Payment Completed', value: 'payment_completed' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Published', value: 'published' }
];

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithUser[] | null>(null);
  const [filter, setFilter] = useState<SubmissionStatus | ''>('');

  function load() {
    const qs = filter ? `?status=${filter}` : '';
    fetch(`/api/admin/submissions${qs}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setSubmissions(data.submissions || []));
  }

  useEffect(load, [filter]);

  const stats = useMemo(() => {
    const all = submissions || [];
    return STAT_CARDS.map((card) => ({
      label: card.label,
      value: card.statuses.length === 0 ? all.length : all.filter((s) => card.statuses.includes(s.status)).length
    }));
  }, [submissions]);

  const columns: BsColumn<SubmissionWithUser>[] = [
    { key: 'code', header: 'Article ID', sortKey: 'articleCode', render: (s) => <span className="fw-semibold">{s.articleCode}</span> },
    { key: 'title', header: 'Title', sortKey: 'title', render: (s) => <span className="text-truncate d-inline-block" style={{ maxWidth: 220 }}>{s.title}</span> },
    { key: 'theme', header: 'Theme', render: (s) => (s.theme === 'Other' ? s.themeOther : s.theme) },
    { key: 'author', header: 'Author', render: (s) => `${s.authorFirstName || ''} ${s.authorLastName || ''}`.trim() || s.userEmail },
    { key: 'date', header: 'Date', render: (s) => new Date(s.createdAt).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    { key: 'payment', header: 'Payment', render: (s) => (s.publicationCharge ? `₹${s.amountPaid} / ₹${s.publicationCharge}` : '—') },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <Link href={`/admin/submissions/${s.id}`} className="btn custom-btn custom-btn-secondary custom-btn-sm">
          View
        </Link>
      )
    }
  ];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="mb-0" style={{ fontSize: 24 }}>
          Article Submissions
        </h1>
        <div className="d-flex gap-2">
          <select className="form-select" style={{ width: 200 }} value={filter} onChange={(e) => setFilter(e.target.value as SubmissionStatus | '')}>
            {FILTERS.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <a href="/api/admin/submissions/export" className="btn custom-btn custom-btn-secondary custom-btn-sm">
            <i className="bi bi-download me-1"></i>Export CSV
          </a>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="col-6 col-md-3 col-lg-2">
            <div className="admin-card py-3 px-3 text-center">
              <div className="text-muted small">{s.label}</div>
              <div className="fw-bold" style={{ fontSize: 22 }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <BootstrapTable
          columns={columns}
          data={submissions || []}
          loading={!submissions}
          searchKeys={['articleCode', 'title', 'authorFirstName', 'authorLastName', 'authorEmail', 'theme']}
        />
      </div>
    </div>
  );
}
