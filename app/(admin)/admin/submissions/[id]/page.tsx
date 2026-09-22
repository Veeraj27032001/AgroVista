'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { ArticleSubmission, SubmissionVersion } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Input from '@/components/ui/Input';
import FileUpload from '@/components/ui/FileUpload';
import Spinner from '@/components/ui/Spinner';

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
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const hasAdminEdit = versions.some((v) => v.isAdminEdit);

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{submission.title}</h1>
        <Badge label={submission.status} />
      </div>
      <p className="mb-6 text-gray-600">{submission.description}</p>

      <h2 className="mb-2 font-semibold">Version History</h2>
      <div className="mb-6 space-y-2">
        {versions.map((v) => (
          <div key={v.id} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            v{v.versionNumber} — {v.submittedBy}
            {v.isAdminEdit ? ' (admin edit)' : ''} — {new Date(v.createdAt).toLocaleString()}
          </div>
        ))}
      </div>

      {submission.status !== 'accepted' && (
        <div className="mb-6 space-y-3 rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold">Review</h3>
          <Textarea label="Revision note" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-3">
            <Button loading={busy} variant="secondary" onClick={sendReview}>
              Request Revision
            </Button>
            <Button loading={busy} onClick={accept}>
              Accept Submission
            </Button>
          </div>
        </div>
      )}

      {submission.status === 'accepted' && (
        <>
          <div className="mb-6 space-y-3 rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold">Upload Admin-Edited Version</h3>
            <FileUpload label="Word File" accept=".doc,.docx" onChange={setEditWord} />
            <FileUpload label="PDF File" accept=".pdf" onChange={setEditPdf} />
            <Button loading={busy} onClick={uploadEdit}>
              Upload Edited Version
            </Button>
          </div>

          {hasAdminEdit && (
            <div className="space-y-3 rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold">Publish as Issue</h3>
              <Input label="Slot ID" value={publishForm.slotId} onChange={(e) => setPublishForm({ ...publishForm, slotId: e.target.value })} />
              <Input label="Poster URL" value={publishForm.posterUrl} onChange={(e) => setPublishForm({ ...publishForm, posterUrl: e.target.value })} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="Soft Rate" type="number" value={publishForm.softRate} onChange={(e) => setPublishForm({ ...publishForm, softRate: e.target.value })} />
                <Input label="Hard Rate" type="number" value={publishForm.hardRate} onChange={(e) => setPublishForm({ ...publishForm, hardRate: e.target.value })} />
                <Input label="Both Rate" type="number" value={publishForm.bothRate} onChange={(e) => setPublishForm({ ...publishForm, bothRate: e.target.value })} />
              </div>
              <Button loading={busy} onClick={publish}>
                Publish
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
