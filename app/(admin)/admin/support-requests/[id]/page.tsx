'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { SupportMessage, SupportRequest, SupportResolution } from '@/lib/db/support-requests';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminSupportRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [request, setRequest] = useState<SupportRequest | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
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

  async function act(status: string, resolution?: SupportResolution) {
    if (status === 'rejected' && !resolutionNote.trim()) {
      toast.error('A reason is required to reject.');
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/support-requests/${id}/action`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolution, resolutionNote })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not complete action.');
      return;
    }
    toast.success('Done');
    load();
  }

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
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  const open = !['resolved', 'rejected', 'closed'].includes(request.status);

  return (
    <div className="admin-card mx-auto" style={{ maxWidth: 600 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="mb-0" style={{ fontSize: 22 }}>
          {request.requestNumber}
        </h1>
        <StatusBadge status={request.status} />
      </div>
      <p className="text-muted small mb-1">Type: {request.type.replace(/_/g, ' ')}</p>
      <p className="mb-3">{request.description}</p>

      {request.attachmentKeys.length > 0 && (
        <p className="text-muted small mb-3">{request.attachmentKeys.length} photo(s) attached.</p>
      )}

      {open && (
        <div className="mb-4">
          <label className="form-label">Resolution note / reject reason</label>
          <textarea className="form-control mb-3" rows={3} value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} />
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn custom-btn custom-btn-secondary" disabled={busy} onClick={() => act('in_review')}>
              Mark In Review
            </button>
            <button type="button" className="btn custom-btn" disabled={busy} onClick={() => act('resolved', 'replace')}>
              Resolve — Replace
            </button>
            <button type="button" className="btn custom-btn" disabled={busy} onClick={() => act('resolved', 'refund')}>
              Resolve — Refund
            </button>
            <button type="button" className="btn custom-btn" disabled={busy} onClick={() => act('resolved', 'access_restored')}>
              Resolve — Access Restored
            </button>
            <button type="button" className="btn custom-btn-danger" disabled={busy} onClick={() => act('rejected')}>
              Reject
            </button>
          </div>
        </div>
      )}

      {request.resolution && (
        <div className="mb-4 p-3 rounded" style={{ background: 'var(--section-bg-color)' }}>
          <strong>Resolution:</strong> {request.resolution.replace(/_/g, ' ')}
          {request.resolutionNote && <div className="small text-muted mt-1">{request.resolutionNote}</div>}
        </div>
      )}

      <h2 className="mb-2" style={{ fontSize: 16, fontWeight: 700 }}>
        Messages
      </h2>
      <div className="mb-3" style={{ maxHeight: 220, overflowY: 'auto' }}>
        {messages.length === 0 && <p className="text-muted small">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className="small border rounded px-3 py-2 mb-2">
            <strong>{m.isStaff ? 'Support Team' : 'User'}:</strong> {m.body}
          </div>
        ))}
      </div>
      <div className="d-flex gap-2">
        <input className="form-control" placeholder="Reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
        <button type="button" className="btn custom-btn" disabled={busy} onClick={sendReply}>
          Send
        </button>
      </div>
    </div>
  );
}
