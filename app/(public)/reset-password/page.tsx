'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-icon">
            <i className="bi bi-x-circle"></i>
          </div>
          <h3 className="mb-2">Missing reset link</h3>
          <p className="mb-0">This page needs a valid token from your email link.</p>
          <p className="mt-3 small text-muted">
            <a href="/forgot-password">Request a new link</a>
          </p>
        </div>
      </div>
    );
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

        {!done ? (
          <>
            <h3 className="mb-2">Choose a new password</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                className="form-control form-control-lg mb-3"
                placeholder="New password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                type="password"
                className="form-control form-control-lg mb-3"
                placeholder="Confirm new password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="submit" className="btn custom-btn w-100" disabled={busy}>
                {busy && <span className="btn-spinner"></span>}
                {busy ? 'Saving…' : 'Reset Password'}
              </button>
            </form>
            <div className={`auth-status${error ? ' error' : ''}`}>{error}</div>
          </>
        ) : (
          <>
            <div className="auth-icon">
              <i className="bi bi-check-circle"></i>
            </div>
            <h3 className="mb-2">Password updated</h3>
            <p className="mb-4">You can now sign in with your new password.</p>
            <a href="/login" className="btn custom-btn w-100">
              Sign In
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
