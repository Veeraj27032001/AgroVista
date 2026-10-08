'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { ArticleMessage, ArticleSubmission } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import FileUpload from '@/components/ui/FileUpload';
import Spinner from '@/components/ui/Spinner';

export default function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [submission, setSubmission] = useState<ArticleSubmission | null>(null);
  const [messages, setMessages] = useState<ArticleMessage[]>([]);
  const [reply, setReply] = useState('');
  const [word, setWord] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  function load() {
    fetch('/api/submissions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const found = (data.submissions || []).find((s: ArticleSubmission) => s.id === id);
        setSubmission(found || null);
      });
    fetch(`/api/submissions/${id}/message`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data) => setMessages(data.messages || []));
  }

  useEffect(load, [id]);

  async function handleResubmit() {
    if (!word) {
      toast.error('Attach your revised manuscript (.doc/.docx).');
      return;
    }
    setBusy(true);
    const form = new FormData();
    form.set('word', word);
    const res = await fetch(`/api/submissions/${id}/resubmit`, { method: 'POST', credentials: 'include', body: form });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not resubmit.');
      return;
    }
    toast.success('Resubmitted');
    setWord(null);
    load();
  }

  async function sendReply() {
    if (!reply.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/submissions/${id}/message`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: reply })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not send message.');
      return;
    }
    setReply('');
    load();
  }

  function paymentLink() {
    if (!submission?.contributionToken) return '';
    return `${window.location.origin}/pay/${submission.contributionToken}`;
  }

  async function copyLink() {
    await navigator.clipboard.writeText(paymentLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!submission) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const canResubmit = submission.status === 'revision_required';
  const canPay = submission.status === 'payment_pending' || submission.status === 'partially_paid';

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{submission.title}</h1>
          <p className="font-mono text-sm text-gray-500">{submission.articleCode}</p>
        </div>
        <Badge label={submission.status} />
      </div>

      {submission.rejectReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Rejection reason:</strong> {submission.rejectReason}
        </div>
      )}

      {canPay && submission.contributionToken && (
        <div className="rounded-xl border border-gray-200 p-4">
          <h2 className="mb-2 font-semibold">Publication Charge</h2>
          <p className="text-sm text-gray-600">
            Total: ₹{submission.publicationCharge} · Paid: ₹{submission.amountPaid} · Balance: ₹
            {(submission.publicationCharge || 0) - submission.amountPaid}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`/pay/${submission.contributionToken}`} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
              Pay Now
            </a>
            <Button type="button" variant="secondary" size="sm" onClick={copyLink}>
              {copied ? 'Link Copied!' : 'Copy Share Link'}
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Please contribute toward the publication charge for our article ${submission.articleCode}: ${paymentLink()}`)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
            >
              Share via WhatsApp
            </a>
          </div>
        </div>
      )}

      {submission.status === 'published' && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Published — Volume {submission.volumeNumber}, Issue {submission.issueNumber}, {submission.publicationMonth}/
          {submission.publicationYear}
          {submission.pageRange ? `, pages ${submission.pageRange}` : ''}
          {submission.articleUrl && (
            <>
              {' · '}
              <a href={submission.articleUrl} target="_blank" rel="noreferrer" className="underline">
                View article
              </a>
            </>
          )}
        </div>
      )}

      {canResubmit && (
        <div className="space-y-3 rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold">Upload Revised Manuscript</h2>
          <FileUpload label="Word File (.doc/.docx)" accept=".doc,.docx" onChange={setWord} />
          <Button loading={busy} onClick={handleResubmit}>
            Resubmit
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold">Editorial Messages</h2>
        <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
          {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet.</p>}
          {messages.map((m) => (
            <div key={m.id} className={`rounded-lg p-2 text-sm ${m.sender === 'admin' ? 'bg-primary-light' : 'bg-gray-100'}`}>
              <span className="font-semibold">{m.sender === 'admin' ? 'Editor' : 'You'}:</span> {m.message}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Write a reply…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <Button size="sm" loading={busy} onClick={sendReply}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
