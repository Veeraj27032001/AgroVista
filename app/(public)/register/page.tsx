'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [busy, setBusy] = useState(false);
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, address, city, state, pincode })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Could not create your account.');
        setBusy(false);
        return;
      }
      window.location.href = '/';
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-wide">
        <a className="navbar-brand" href="/">
          <span className="navbar-brand-mark">
            <i className="bi bi-flower1"></i>
          </span>
          <span className="navbar-brand-text">
            AgroVista<small>Monthly Magazine</small>
          </span>
        </a>

        <h3 className="mb-2 text-center">Create your account</h3>
        <p className="mb-4 text-center">Sign up to unlock issues and read online.</p>

        <form onSubmit={handleSubmit} className="row g-3">
          <div className="col-md-6">
            <label className="form-label mb-2">Full Name</label>
            <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-2">Email address</label>
            <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="col-md-6">
            <label className="form-label mb-2">Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-2">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label mb-2">Phone</label>
            <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-2">Pincode</label>
            <input type="text" className="form-control" value={pincode} onChange={(e) => setPincode(e.target.value)} />
          </div>

          <div className="col-12">
            <label className="form-label mb-2">Address</label>
            <input type="text" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="col-md-6">
            <label className="form-label mb-2">City</label>
            <input type="text" className="form-control" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-2">State</label>
            <input type="text" className="form-control" value={state} onChange={(e) => setState(e.target.value)} />
          </div>

          <div className="col-12">
            <button type="submit" className="btn custom-btn w-100" disabled={busy}>
              {busy && <span className="btn-spinner"></span>}
              {busy ? 'Creating account…' : 'Create Account'}
            </button>
          </div>
        </form>
        <div className={`auth-status${error ? ' error' : ''}`}>{error}</div>
        <p className="mt-3 small text-muted text-center">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
