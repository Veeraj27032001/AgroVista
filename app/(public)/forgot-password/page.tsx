'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <a className="navbar-brand" href="/">
          <span className="navbar-brand-mark">
            <i className="bi bi-flower1"></i>
          </span>
          <span className="navbar-brand-text">
            AgroVista<small>Monthly Magazine</small>
          </span>
        </a>

        {!sent ? (
          <>
            <h3 className="mb-2">Forgot your password?</h3>
            <p className="mb-4">Enter your email and we&apos;ll send you a link to reset it.</p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                className="form-control form-control-lg mb-3"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="btn custom-btn w-100" disabled={busy}>
                {busy && <span className="btn-spinner"></span>}
                {busy ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
            <div className={`auth-status${error ? ' error' : ''}`}>{error}</div>
          </>
        ) : (
          <>
            <div className="auth-icon">
              <i className="bi bi-check-circle"></i>
            </div>
            <h3 className="mb-2">Check your email</h3>
            <p className="mb-0">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password. It
              expires in 30 minutes.
            </p>
          </>
        )}
        <p className="mt-3 small text-muted">
          <a href="/login">Back to sign in</a>
        </p>
      </div>
    </div>
  );
}
