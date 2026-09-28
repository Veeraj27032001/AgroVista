'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { User } from '@/lib/types';
import LocationSelects from '@/components/public/LocationSelects';

function EditProfileInner() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';
  const incomplete = searchParams.get('incomplete') === '1';
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          window.location.href = `/login?redirect=${encodeURIComponent('/account/edit')}`;
          return;
        }
        setUser(data.user);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) {
      setError('Could not save changes.');
      setBusy(false);
      return;
    }
    window.location.href = redirect;
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-wide">
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

        <h3 className="mb-2 text-center">Edit your profile</h3>
        <p className="mb-4 text-center">
          {incomplete ? 'Complete your profile (phone, address, location) to place an order.' : 'Keep your details up to date.'}
        </p>

        <form onSubmit={handleSubmit} className="row g-3">
          <div className="col-md-6">
            <label className="form-label mb-2">Full Name</label>
            <input type="text" className="form-control" required value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-2">Email address</label>
            <input type="email" className="form-control" value={user.email} disabled />
          </div>

          <div className="col-12">
            <label className="form-label mb-2">Phone</label>
            <input type="text" className="form-control" value={user.phone || ''} onChange={(e) => setUser({ ...user, phone: e.target.value })} />
          </div>

          <div className="col-12">
            <label className="form-label mb-2">Address</label>
            <input type="text" className="form-control" value={user.address || ''} onChange={(e) => setUser({ ...user, address: e.target.value })} />
          </div>

          <div className="col-md-6">
            <label className="form-label mb-2">City</label>
            <input type="text" className="form-control" value={user.city || ''} onChange={(e) => setUser({ ...user, city: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-2">Pincode</label>
            <input type="text" className="form-control" value={user.pincode || ''} onChange={(e) => setUser({ ...user, pincode: e.target.value })} />
          </div>

          <LocationSelects
            stateId={user.stateId || ''}
            districtId={user.districtId || ''}
            talukId={user.talukId || ''}
            onChange={(next) => setUser({ ...user, stateId: next.stateId, districtId: next.districtId, talukId: next.talukId })}
          />

          <div className="col-12">
            <button type="submit" className="btn custom-btn w-100" disabled={busy}>
              {busy && <span className="btn-spinner"></span>}
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
        <div className={`auth-status${error ? ' error' : ''}`}>{error}</div>
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense>
      <EditProfileInner />
    </Suspense>
  );
}
