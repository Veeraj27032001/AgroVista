'use client';

import { useState } from 'react';

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setBusy(true);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.message || 'Could not change password.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccess('Password updated.');
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <a href="/account" className="auth-card-back">
          &larr; Profile
        </a>
        <a className="navbar-brand" href="/">
          <span className="navbar-brand-mark">
            <i className="bi bi-flower1"></i>
          </span>
          <span className="navbar-brand-text">
            AgroVista<small>Monthly Magazine</small>
          </span>
        </a>

        <h3 className="mb-2 text-center">Change your password</h3>
        <p className="mb-4 text-center">Enter your current and new password.</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label mb-2">Current Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label mb-2">New Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label mb-2">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn custom-btn w-100" disabled={busy}>
            {busy && <span className="btn-spinner"></span>}
            {busy ? 'Updating…' : 'Update Password'}
          </button>
        </form>
        <div className={`auth-status${error ? ' error' : ''}`}>{error}</div>
        {success && <div className="auth-status">{success}</div>}
      </div>
    </div>
  );
}
