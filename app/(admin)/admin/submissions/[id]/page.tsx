'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { ArticleSubmission, SubmissionVersion } from '@/lib/types';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminSubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [submission, setSubmission] = useState<ArticleSubmission | null>(null);
  const [versions, setVersions] = useState<SubmissionVersion[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [editWord, setEditWord] = useState<File | null>(null);
  const [editPdf, setEditPdf] = useState<File | null>(null);
  const [publishForm, setPublishForm] = useState({ slotId: '', posterUrl: '', softRate: '', hardRate: '', bothRate: '' });

  function load() {
    fetch(`/api/admin/submissions/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setSubmission(data.submission);
        setVersions(data.versions || []);
      });
  }

  useEffect(load, [id]);

  async function sendReview() {
    if (!note.trim()) return toast.error('Add a note for the author.');
    setBusy(true);
    const res = await fetch(`/api/admin/submissions/${id}/review`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    });
    setBusy(false);
    if (!res.ok) return toast.error('Could not send revision request.');
    toast.success('Revision request sent');
    load();
  }

  async function accept() {
    setBusy(true);
    const res = await fetch(`/api/admin/submissions/${id}/accept`, { method: 'POST', credentials: 'include' });
    setBusy(false);
    if (!res.ok) return toast.error('Could not accept.');
    toast.success('Accepted');
    load();
  }

  async function uploadEdit() {
    if (!editWord || !editPdf) return toast.error('Attach both files.');
    setBusy(true);
    const form = new FormData();
    form.set('word', editWord);
    form.set('pdf', editPdf);
    const res = await fetch(`/api/admin/submissions/${id}/upload-edit`, { method: 'POST', credentials: 'include', body: form });
    setBusy(false);
    if (!res.ok) return toast.error('Could not upload.');
    toast.success('Edited version uploaded');
    load();
  }

  async function publish() {
    setBusy(true);
    const res = await fetch(`/api/admin/submissions/${id}/publish`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: publishForm.slotId,
        posterUrl: publishForm.posterUrl || undefined,
        softRate: publishForm.softRate ? Number(publishForm.softRate) : undefined,
        hardRate: publishForm.hardRate ? Number(publishForm.hardRate) : undefined,
        bothRate: publishForm.bothRate ? Number(publishForm.bothRate) : undefined
      })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return toast.error(data.message || 'Could not publish.');
    toast.success('Published as issue!');
    window.location.href = `/admin/issues/${data.issue.id}`;
  }

  if (!submission) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  const hasAdminEdit = versions.some((v) => v.isAdminEdit);

  return (
    <div className="admin-card mx-auto" style={{ maxWidth: 640 }}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h1 className="mb-0" style={{ fontSize: 22 }}>
          {submission.title}
        </h1>
        <StatusBadge status={submission.status} />
      </div>
      <p className="text-muted mb-4">{submission.description}</p>

      <h2 className="mb-2" style={{ fontSize: 16, fontWeight: 700 }}>
        Version History
      </h2>
      <div className="mb-4">
        {versions.map((v) => (
          <div key={v.id} className="border rounded px-3 py-2 mb-2 small">
            v{v.versionNumber} — {v.submittedBy}
            {v.isAdminEdit ? ' (admin edit)' : ''} — {new Date(v.createdAt).toLocaleString()}
          </div>
        ))}
      </div>

      {submission.status !== 'accepted' && (
        <div className="mb-4 p-3 border rounded">
          <h3 style={{ fontSize: 15, fontWeight: 700 }} className="mb-3">
            Review
          </h3>
          <div className="mb-3">
            <label className="form-label">Revision note</label>
            <textarea className="form-control" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn custom-btn custom-btn-secondary" disabled={busy} onClick={sendReview}>
              {busy && <span className="btn-spinner"></span>}
              Request Revision
            </button>
            <button type="button" className="btn custom-btn" disabled={busy} onClick={accept}>
              {busy && <span className="btn-spinner"></span>}
              Accept Submission
            </button>
          </div>
        </div>
      )}

      {submission.status === 'accepted' && (
        <>
          <div className="mb-4 p-3 border rounded">
            <h3 style={{ fontSize: 15, fontWeight: 700 }} className="mb-3">
              Upload Admin-Edited Version
            </h3>
            <div className="mb-3">
              <label className="form-label">Word File</label>
              <input type="file" className="form-control" accept=".doc,.docx" onChange={(e) => setEditWord(e.target.files?.[0] || null)} />
            </div>
            <div className="mb-3">
              <label className="form-label">PDF File</label>
              <input type="file" className="form-control" accept=".pdf" onChange={(e) => setEditPdf(e.target.files?.[0] || null)} />
            </div>
            <button type="button" className="btn custom-btn" disabled={busy} onClick={uploadEdit}>
              {busy && <span className="btn-spinner"></span>}
              Upload Edited Version
            </button>
          </div>

          {hasAdminEdit && (
            <div className="p-3 border rounded">
              <h3 style={{ fontSize: 15, fontWeight: 700 }} className="mb-3">
                Publish as Issue
              </h3>
              <div className="mb-3">
                <label className="form-label">Slot ID</label>
                <input
                  className="form-control"
                  value={publishForm.slotId}
                  onChange={(e) => setPublishForm({ ...publishForm, slotId: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Poster URL</label>
                <input
                  className="form-control"
                  value={publishForm.posterUrl}
                  onChange={(e) => setPublishForm({ ...publishForm, posterUrl: e.target.value })}
                />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label">Soft Rate</label>
                  <input
                    type="number"
                    className="form-control"
                    value={publishForm.softRate}
                    onChange={(e) => setPublishForm({ ...publishForm, softRate: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Hard Rate</label>
                  <input
                    type="number"
                    className="form-control"
                    value={publishForm.hardRate}
                    onChange={(e) => setPublishForm({ ...publishForm, hardRate: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Both Rate</label>
                  <input
                    type="number"
                    className="form-control"
                    value={publishForm.bothRate}
                    onChange={(e) => setPublishForm({ ...publishForm, bothRate: e.target.value })}
                  />
                </div>
              </div>
              <button type="button" className="btn custom-btn" disabled={busy} onClick={publish}>
                {busy && <span className="btn-spinner"></span>}
                Publish
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
