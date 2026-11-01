'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { ArticleCoAuthor, ArticleMessage, ArticlePayment, ArticleSubmission, Issue, SubmissionVersion } from '@/lib/types';
import type { AuthorPayout } from '@/lib/db/author-payouts';
import StatusBadge from '@/components/admin/StatusBadge';

type Detail = {
  submission: ArticleSubmission;
  versions: SubmissionVersion[];
  coAuthors: ArticleCoAuthor[];
  payments: ArticlePayment[];
  payouts: AuthorPayout[];
};

function Person({ label, salutation, first, middle, last, email, phone, affiliation, designation, city, state, country }: Record<string, string | null | undefined>) {
  return (
    <div className="mb-3">
      <div className="text-muted small text-uppercase mb-1">{label}</div>
      <div className="fw-semibold">
        {salutation} {first} {middle} {last}
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
  const [issues, setIssues] = useState<Issue[]>([]);
  const [scheduleIssueId, setScheduleIssueId] = useState('');
  const [pageFrom, setPageFrom] = useState('');
  const [pageTo, setPageTo] = useState('');
  const [articleUrl, setArticleUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [payoutRecipient, setPayoutRecipient] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank_transfer' | 'other'>('upi');
  const [payoutNote, setPayoutNote] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editWord, setEditWord] = useState<File | null>(null);
  const [editPdf, setEditPdf] = useState<File | null>(null);
  const [uploadingEdit, setUploadingEdit] = useState(false);

  function load() {
    fetch(`/api/admin/submissions/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setDetail);
    fetch(`/api/admin/submissions/${id}/message`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []));
  }

  useEffect(load, [id]);
  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setIsAdmin(data.user?.role === 'admin'));
    fetch('/api/admin/issues', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setIssues(data.issues || []));
  }, []);

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

  async function recordPayout() {
    const recipient = recipients.find((r) => r.email === payoutRecipient);
    if (!recipient || !payoutAmount) return;
    const ok = await act('payouts', {
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      amount: Number(payoutAmount),
      method: payoutMethod,
      referenceNote: payoutNote
    });
    if (ok) {
      setPayoutAmount('');
      setPayoutNote('');
    }
  }

  function downloadUrl(path: string, isAdminEdit: boolean) {
    return `/api/admin/submissions/${id}/download?path=${encodeURIComponent(path)}&adminEdit=${isAdminEdit ? '1' : '0'}`;
  }

  async function uploadFinalVersion() {
    if (!editWord || !editPdf) {
      toast.error('Attach both a Word file and a PDF file.');
      return;
    }
    setUploadingEdit(true);
    const form = new FormData();
    form.set('word', editWord);
    form.set('pdf', editPdf);
    const res = await fetch(`/api/admin/submissions/${id}/upload-edit`, { method: 'POST', credentials: 'include', body: form });
    const data = await res.json();
    setUploadingEdit(false);
    if (!res.ok) {
      toast.error(data.message || 'Could not upload the final version.');
      return;
    }
    toast.success('Final version uploaded.');
    setEditWord(null);
    setEditPdf(null);
    load();
  }

  if (!detail) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  const { submission: s, versions, coAuthors, payments, payouts } = detail;
  const inReview = ['submitted', 'under_review', 'resubmitted'].includes(s.status);
  const balance = (s.publicationCharge || 0) - s.amountPaid;
  const recipients = [
    { email: s.authorEmail || '', name: [s.authorFirstName, s.authorLastName].filter(Boolean).join(' ') },
    ...coAuthors.map((c) => ({ email: c.email, name: [c.firstName, c.lastName].filter(Boolean).join(' ') }))
  ].filter((r) => r.email);
  const canPayAuthor = isAdmin && ['payment_completed', 'scheduled', 'published'].includes(s.status);
  const canUploadEdit = ['accepted', 'payment_pending', 'partially_paid', 'payment_completed', 'scheduled', 'published'].includes(s.status);

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
            middle={s.authorMiddleName}
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
              middle={c.middleName}
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

        {inReview && isAdmin && (
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
            <p className="text-muted small mb-3">Link this article to the issue it will be published in.</p>
            <div className="mb-3">
              <label className="form-label">Issue</label>
              <select className="form-select" value={scheduleIssueId} onChange={(e) => setScheduleIssueId(e.target.value)}>
                <option value="">Select an issue…</option>
                {issues.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title} {i.volumeNumber ? `— Vol ${i.volumeNumber}, Issue ${i.slotNumber}` : ''} ({i.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Page From</label>
                <input className="form-control" type="number" value={pageFrom} onChange={(e) => setPageFrom(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Page To</label>
                <input className="form-control" type="number" value={pageTo} onChange={(e) => setPageTo(e.target.value)} />
              </div>
            </div>
            <button
              type="button"
              className="btn custom-btn mt-3"
              disabled={busy || !scheduleIssueId}
              onClick={() =>
                act('schedule', {
                  issueId: scheduleIssueId,
                  pageFrom: pageFrom ? Number(pageFrom) : undefined,
                  pageTo: pageTo ? Number(pageTo) : undefined
                })
              }
            >
              Save Schedule
            </button>
          </div>
        )}

        {s.status === 'scheduled' && isAdmin && (
          <div className="admin-card mb-4">
            <h2 className="mb-3" style={{ fontSize: 16, fontWeight: 700 }}>
              Publish
            </h2>
            <p className="text-muted small">
              Volume {s.volumeNumber}, Issue {s.issueNumber} ({s.publicationYear})
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

        {canPayAuthor && (
          <div className="admin-card mt-4">
            <h2 className="mb-1" style={{ fontSize: 16, fontWeight: 700 }}>
              Pay Author(s)
            </h2>
            <p className="text-muted small mb-3">
              Transfer the amount yourself via UPI/bank, then record it here — this is a ledger entry, not a live payout.
            </p>

            {payouts.length > 0 && (
              <div className="mb-3">
                {payouts.map((p) => (
                  <div key={p.id} className="small border-bottom py-2">
                    <div className="d-flex justify-content-between">
                      <span>{p.recipientName}</span>
                      <span className="badge rounded-pill text-bg-success">paid</span>
                    </div>
                    <div className="text-muted">
                      {p.recipientEmail} · ₹{p.amount} · {p.method || '—'} · {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                    {p.referenceNote && <div className="text-muted">{p.referenceNote}</div>}
                  </div>
                ))}
              </div>
            )}

            <div className="mb-2">
              <label className="form-label">Recipient</label>
              <select className="form-select" value={payoutRecipient} onChange={(e) => setPayoutRecipient(e.target.value)}>
                <option value="">Select…</option>
                {recipients.map((r) => (
                  <option key={r.email} value={r.email}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="row g-2 mb-2">
              <div className="col-6">
                <label className="form-label">Amount (₹)</label>
                <input className="form-control" type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label">Method</label>
                <select className="form-select" value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as typeof payoutMethod)}>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <label className="form-label">Reference / Note</label>
            <input className="form-control mb-3" value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)} placeholder="UTR / transaction note" />
            <button
              type="button"
              className="btn custom-btn w-100"
              disabled={busy || !payoutRecipient || !payoutAmount}
              onClick={recordPayout}
            >
              Record Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
