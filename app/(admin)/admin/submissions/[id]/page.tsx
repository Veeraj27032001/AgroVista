'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { ArticleCoAuthor, ArticleMessage, ArticlePayment, ArticleSubmission, SubmissionVersion } from '@/lib/types';
import StatusBadge from '@/components/admin/StatusBadge';

type Detail = {
  submission: ArticleSubmission;
  versions: SubmissionVersion[];
  coAuthors: ArticleCoAuthor[];
  payments: ArticlePayment[];
};

function Person({ label, salutation, first, last, email, phone, affiliation, designation, city, state, country }: Record<string, string | null | undefined>) {
  return (
    <div className="mb-3">
      <div className="text-muted small text-uppercase mb-1">{label}</div>
      <div className="fw-semibold">
        {salutation} {first} {last}
      </div>
      <div className="small text-muted">
        {email} {phone && `· ${phone}`}
      </div>
      <div className="small text-muted">
        {[affiliation, designation].filter(Boolean).join(', ')}
        {(affiliation || designation) && (city || state) ? ' — ' : ''}
        {[city, state, country].filter(Boolean).join(', ')}
      </div>
    </div>
  );
}

export default function AdminSubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [messages, setMessages] = useState<ArticleMessage[]>([]);
  const [note, setNote] = useState('');
  const [charge, setCharge] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [schedule, setSchedule] = useState({ volumeNumber: '', issueNumber: '', publicationMonth: '', publicationYear: '', pageRange: '' });
  const [articleUrl, setArticleUrl] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/admin/submissions/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setDetail);
    fetch(`/api/admin/submissions/${id}/message`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []));
  }

  useEffect(load, [id]);

  async function act(path: string, body?: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch(`/api/admin/submissions/${id}/${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.message || 'Action failed.');
      return false;
    }
    toast.success('Done');
    load();
    return true;
  }

  async function sendNote() {
    if (!note.trim()) return;
    await act('message', { message: note });
    setNote('');
  }

  function downloadUrl(path: string, isAdminEdit: boolean) {
    return `/api/admin/submissions/${id}/download?path=${encodeURIComponent(path)}&adminEdit=${isAdminEdit ? '1' : '0'}`;
  }

  if (!detail) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  const { submission: s, versions, coAuthors, payments } = detail;
  const inReview = ['submitted', 'under_review', 'resubmitted'].includes(s.status);
  const balance = (s.publicationCharge || 0) - s.amountPaid;

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="admin-card mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h1 className="mb-0" style={{ fontSize: 22 }}>
                {s.title}
              </h1>
              <span className="font-monospace text-muted small">{s.articleCode}</span>
            </div>
            <StatusBadge status={s.status} />
          </div>
          <p className="text-muted small mb-2">
            Theme: {s.theme === 'Other' ? s.themeOther : s.theme} · Language: {s.language} · Submitted:{' '}
            {new Date(s.createdAt).toLocaleDateString()}
            {s.wordCount ? ` · ${s.wordCount} words` : ''}
          </p>
          {s.description && <p className="mb-3">{s.description}</p>}

          <Person
            label="Primary Author"
            salutation={s.authorSalutation}
            first={s.authorFirstName}
            last={s.authorLastName}
            email={s.authorEmail}
            phone={s.authorPhone}
            affiliation={s.authorAffiliation}
            designation={s.authorDesignation}
            city={s.authorCity}
            state={s.authorState}
            country={s.authorCountry}
          />
          {coAuthors.map((c) => (
            <Person
              key={c.id}
              label={`Co-Author ${c.position}`}
              salutation={c.salutation}
              first={c.firstName}
              last={c.lastName}
              email={c.email}
              phone={c.phone}
              affiliation={c.affiliation}
              designation={c.designation}
              city={c.city}
              state={c.state}
              country={c.country}
            />
          ))}

          <div className="mt-3">
            <div className="text-muted small text-uppercase mb-1">Manuscript Versions</div>
            {versions.map((v) => (
              <div key={v.id} className="d-flex align-items-center justify-content-between border rounded px-3 py-2 mb-1">
                <span className="small">
                  v{v.versionNumber} — {v.submittedBy}
                  {v.isAdminEdit ? ' (admin edit)' : ''} — {new Date(v.createdAt).toLocaleString()}
                </span>
                <a href={downloadUrl(v.wordPath, v.isAdminEdit)} className="btn custom-btn custom-btn-secondary custom-btn-sm">
                  <i className="bi bi-download me-1"></i>Download
                </a>
              </div>
            ))}
          </div>
        </div>

        {inReview && (
          <div className="admin-card mb-4">
            <h2 className="mb-3" style={{ fontSize: 16, fontWeight: 700 }}>
              Editorial Decision
            </h2>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Publication Charge (₹) — for Accept</label>
                <input className="form-control" type="number" value={charge} onChange={(e) => setCharge(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Reject Reason — for Reject</label>
                <input className="form-control" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                className="btn custom-btn"
                disabled={busy || !charge}
                onClick={() => act('accept', { publicationCharge: Number(charge) })}
              >
                Accept
              </button>
              <button
                type="button"
                className="btn custom-btn-danger"
                disabled={busy || !rejectReason.trim()}
                onClick={() => act('reject', { reason: rejectReason })}
              >
                Reject
              </button>
              <button
                type="button"
                className="btn custom-btn custom-btn-secondary"
                disabled={busy || !note.trim()}
                onClick={async () => {
                  await act('review', { note });
                  setNote('');
                }}
              >
                Request Revision
              </button>
              <button type="button" className="btn custom-btn custom-btn-secondary" disabled={busy} onClick={() => act('hold')}>
                Hold / Further Review
              </button>
            </div>
            <p className="text-muted small mt-2">Revision note uses the message box below.</p>
          </div>
        )}

        {s.status === 'payment_completed' && (
          <div className="admin-card mb-4">
            <h2 className="mb-3" style={{ fontSize: 16, fontWeight: 700 }}>
              Schedule Publication
            </h2>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Volume</label>
                <input
                  className="form-control"
                  type="number"
                  value={schedule.volumeNumber}
                  onChange={(e) => setSchedule({ ...schedule, volumeNumber: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Issue</label>
                <input
                  className="form-control"
                  type="number"
                  value={schedule.issueNumber}
                  onChange={(e) => setSchedule({ ...schedule, issueNumber: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Month</label>
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  max={12}
                  value={schedule.publicationMonth}
                  onChange={(e) => setSchedule({ ...schedule, publicationMonth: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Year</label>
                <input
                  className="form-control"
                  type="number"
                  value={schedule.publicationYear}
                  onChange={(e) => setSchedule({ ...schedule, publicationYear: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Page Range</label>
                <input
                  className="form-control"
                  placeholder="e.g. 24-28"
                  value={schedule.pageRange}
                  onChange={(e) => setSchedule({ ...schedule, pageRange: e.target.value })}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn custom-btn mt-3"
              disabled={busy}
              onClick={() =>
                act('schedule', {
                  volumeNumber: Number(schedule.volumeNumber),
                  issueNumber: Number(schedule.issueNumber),
                  publicationMonth: Number(schedule.publicationMonth),
                  publicationYear: Number(schedule.publicationYear),
                  pageRange: schedule.pageRange
                })
              }
            >
              Save Schedule
            </button>
          </div>
        )}

        {s.status === 'scheduled' && (
          <div className="admin-card mb-4">
            <h2 className="mb-3" style={{ fontSize: 16, fontWeight: 700 }}>
              Publish
            </h2>
            <p className="text-muted small">
              Volume {s.volumeNumber}, Issue {s.issueNumber}, {s.publicationMonth}/{s.publicationYear}
              {s.pageRange ? `, pages ${s.pageRange}` : ''}
            </p>
            <label className="form-label">Article URL (optional)</label>
            <input className="form-control mb-3" value={articleUrl} onChange={(e) => setArticleUrl(e.target.value)} />
            <button type="button" className="btn custom-btn" disabled={busy} onClick={() => act('publish', { articleUrl })}>
              Mark Published
            </button>
          </div>
        )}

        <div className="admin-card">
          <h2 className="mb-3" style={{ fontSize: 16, fontWeight: 700 }}>
            Messages
          </h2>
          <div className="mb-3" style={{ maxHeight: 220, overflowY: 'auto' }}>
            {messages.length === 0 && <p className="text-muted small">No messages yet.</p>}
            {messages.map((m) => (
              <div key={m.id} className="small border rounded px-3 py-2 mb-2">
                <strong>{m.sender === 'admin' ? 'Editor' : 'Author'}:</strong> {m.message}
              </div>
            ))}
          </div>
          <div className="d-flex gap-2">
            <input className="form-control" placeholder="Write a note or revision message…" value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="button" className="btn custom-btn" disabled={busy} onClick={sendNote}>
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="admin-card">
          <h2 className="mb-3" style={{ fontSize: 16, fontWeight: 700 }}>
            Payment Tracking
          </h2>
          {s.publicationCharge ? (
            <>
              <p className="small mb-3">
                Charge: ₹{s.publicationCharge} · Paid: ₹{s.amountPaid} · Balance: ₹{Math.max(0, balance)}
              </p>
              {payments.length === 0 ? (
                <p className="text-muted small">No transactions yet.</p>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="small border-bottom py-2">
                    <div className="d-flex justify-content-between">
                      <span>{p.contributorName}</span>
                      <span className={`badge rounded-pill ${p.status === 'success' ? 'text-bg-success' : p.status === 'failed' ? 'text-bg-danger' : 'text-bg-secondary'}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-muted">
                      {p.contributorEmail} · ₹{p.amount} · {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <p className="text-muted small">Publication charge not set yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
