'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import type { AuthorRequest } from '@/lib/db/author-requests';

export default function BecomeAuthorForm() {
  const [request, setRequest] = useState<AuthorRequest | null | undefined>(undefined);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    fetch('/api/author-requests', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setRequest(data.request || null));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/author-requests', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message || 'Could not submit your request.');
      setBusy(false);
      return;
    }
    toast.success('Request submitted — an admin will review it shortly.');
    setRequest(data.request);
    setBusy(false);
  }

  if (request === undefined) {
    return (
      <div className="flex justify-center pt-[200px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-[150px]">
      <h1 className="mb-2 text-3xl font-bold">Become an Author</h1>
      <p className="mb-6 text-gray-600">
        Approved Authors can submit articles for publication in AgriOxen. Send a request below — an admin will review it.
      </p>

      {request && request.status === 'pending' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <Badge label="pending" />
          <p className="mt-2 text-sm text-gray-700">Your request is awaiting admin review. We&apos;ll notify you by email once it&apos;s decided.</p>
        </div>
      )}

      {request && request.status === 'rejected' && (
        <>
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <Badge label="rejected" />
            <p className="mt-2 text-sm text-gray-700">
              Your previous request was not approved{request.adminNote ? `: ${request.adminNote}` : '.'}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea label="Tell us why you'd like to become an Author (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="submit" className="w-full" loading={busy}>
              Request Again
            </Button>
          </form>
        </>
      )}

      {!request && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea label="Tell us why you'd like to become an Author (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button type="submit" className="w-full" loading={busy}>
            Request Author Status
          </Button>
        </form>
      )}
    </div>
  );
}
