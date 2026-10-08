'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { SupportMessage, SupportRequest } from '@/lib/db/support-requests';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function HelpRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [request, setRequest] = useState<SupportRequest | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/support-requests/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setRequest(data.request));
    fetch(`/api/support-requests/${id}/message`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []));
  }

  useEffect(load, [id]);

  async function sendReply() {
    if (!reply.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/support-requests/${id}/message`, {
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

  if (!request) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{request.requestNumber}</h1>
        <Badge label={request.status} />
      </div>
      <p className="mb-2 text-sm text-gray-500">{request.type.replace(/_/g, ' ')}</p>
      <p className="mb-4">{request.description}</p>

      {request.resolution && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <strong>Resolution:</strong> {request.resolution.replace(/_/g, ' ')}
          {request.resolutionNote && <div className="mt-1">{request.resolutionNote}</div>}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold">Messages</h2>
        <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
          {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet.</p>}
          {messages.map((m) => (
            <div key={m.id} className={`rounded-lg p-2 text-sm ${m.isStaff ? 'bg-primary-light' : 'bg-gray-100'}`}>
              <span className="font-semibold">{m.isStaff ? 'Support Team' : 'You'}:</span> {m.body}
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
