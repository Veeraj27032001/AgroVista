'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginOtpForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [channel, setChannel] = useState<'email' | 'phone'>('email');
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, value })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
        setBusy(false);
        return;
      }
      setSent(true);
      setBusy(false);
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Incorrect code.');
        setBusy(false);
        return;
      }
      window.location.href = redirect;
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

        <h3 className="mb-2">Sign in with a one-time code</h3>

        {!sent ? (
          <>
            <p className="mb-4">Choose how you&apos;d like to receive your code.</p>
            <div className="auth-tabs mb-3">
              <button
                type="button"
                className={`auth-tab${channel === 'email' ? ' active' : ''}`}
                onClick={() => setChannel('email')}
              >
                Email
              </button>
              <button
                type="button"
                className={`auth-tab${channel === 'phone' ? ' active' : ''}`}
                onClick={() => setChannel('phone')}
              >
                Phone
              </button>
            </div>
            <form onSubmit={handleSend}>
              <input
                type={channel === 'email' ? 'email' : 'tel'}
                className="form-control form-control-lg mb-3"
                placeholder={channel === 'email' ? 'you@example.com' : 'Phone number'}
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <button type="submit" className="btn custom-btn w-100" disabled={busy}>
                {busy && <span className="btn-spinner"></span>}
                {busy ? 'Sending…' : 'Send Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mb-4">Enter the 6-digit code we sent you.</p>
            <form onSubmit={handleVerify}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="form-control form-control-lg mb-3 text-center"
                placeholder="••••••"
                style={{ letterSpacing: 8, fontSize: 24 }}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              <button type="submit" className="btn custom-btn w-100" disabled={busy}>
                {busy && <span className="btn-spinner"></span>}
                {busy ? 'Verifying…' : 'Verify & Sign In'}
              </button>
            </form>
          </>
        )}
        <div className={`auth-status${error ? ' error' : ''}`}>{error}</div>
        <div className="auth-divider">
          <span>or</span>
        </div>
        <a href="/login" className="btn custom-btn custom-btn-secondary w-100">
          Sign in with Password
        </a>
      </div>
    </div>
  );
}

export default function LoginOtpPage() {
  return (
    <Suspense>
      <LoginOtpForm />
    </Suspense>
  );
}
