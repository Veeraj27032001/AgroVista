'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    setBusy(false);
    if (!res.ok) {
      setError('Could not send your message. Please try again.');
      return;
    }
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
  }

  if (sent) {
    return <div className="auth-status">Thanks — we&apos;ve received your message and will get back to you soon.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="row g-3">
      <div className="col-md-6">
        <label className="form-label mb-2">Full Name</label>
        <input type="text" className="form-control" placeholder="Your name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="col-md-6">
        <label className="form-label mb-2">Email address</label>
        <input
          type="email"
          className="form-control"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="col-12">
        <label className="form-label mb-2">Message</label>
        <textarea
          className="form-control"
          rows={4}
          placeholder="Tell us what you'd like to see covered"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>
      </div>
      {error && <div className="col-12 auth-status error">{error}</div>}
      <div className="col-12">
        <button type="submit" className="btn custom-btn" disabled={busy}>
          {busy && <span className="btn-spinner"></span>}
          Send Message
        </button>
      </div>
    </form>
  );
}
