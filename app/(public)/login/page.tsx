'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Incorrect email or password.');
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

        <h3 className="mb-2">Sign in to read your issues</h3>
        <p className="mb-4">Enter your email and password to continue.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="form-control form-control-lg mb-3"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="form-control form-control-lg mb-2"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="text-end mb-3">
            <a href="/forgot-password" className="small">
              Forgot password?
            </a>
          </div>
          <button type="submit" className="btn custom-btn w-100" disabled={busy}>
            {busy && <span className="btn-spinner"></span>}
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div className={`auth-status${error ? ' error' : ''}`}>{error}</div>
        <div className="auth-divider">
          <span>or</span>
        </div>
        <a href="/login-otp" className="btn custom-btn custom-btn-secondary w-100 mb-2">
          Sign in with a Code
        </a>
        <a href="/register" className="btn custom-btn custom-btn-secondary w-100">
          Create an Account
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
