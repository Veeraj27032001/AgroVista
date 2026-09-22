'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { ArticleSubmission } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import FileUpload from '@/components/ui/FileUpload';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<ArticleSubmission[] | null>(null);
  const [resubmitTarget, setResubmitTarget] = useState<ArticleSubmission | null>(null);
  const [word, setWord] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch('/api/submissions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setSubmissions(data.submissions || []));
  }

  useEffect(load, []);

  async function handleResubmit() {
    if (!resubmitTarget || !word || !pdf) {
      toast.error('Attach both files.');
      return;
    }
    setBusy(true);
    const form = new FormData();
    form.set('word', word);
    form.set('pdf', pdf);
    const res = await fetch(`/api/submissions/${resubmitTarget.id}/resubmit`, { method: 'POST', credentials: 'include', body: form });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not resubmit.');
      return;
    }
    toast.success('Resubmitted');
    setResubmitTarget(null);
    setWord(null);
    setPdf(null);
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Article Submissions</h1>
      {!submissions ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-gray-500">You haven&apos;t submitted any articles yet.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div key={s.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{s.title}</p>
                <Badge label={s.status} />
              </div>
              {s.adminNote && <p className="mt-2 text-sm text-gray-600">Editor note: {s.adminNote}</p>}
              {s.status === 'revision_requested' && (
                <Button size="sm" variant="secondary" className="mt-3" onClick={() => setResubmitTarget(s)}>
                  Resubmit
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!resubmitTarget} onClose={() => setResubmitTarget(null)} title="Resubmit revised files">
        <div className="space-y-4">
          <FileUpload label="Word File" accept=".doc,.docx" onChange={setWord} />
          <FileUpload label="PDF File" accept=".pdf" onChange={setPdf} />
          <Button className="w-full" loading={busy} onClick={handleResubmit}>
            Resubmit
          </Button>
        </div>
      </Modal>
    </div>
  );
}
