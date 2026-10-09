'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';

type ProfileUser = User & { stateName: string | null; districtName: string | null; talukName: string | null };

function Field({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="profile-field">
      <div className="profile-field-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <div className="profile-field-label">{label}</div>
        <div className="profile-field-value">{value || '—'}</div>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          window.location.href = `/login?redirect=${encodeURIComponent('/account')}`;
          return;
        }
        setUser(data.user);
      });
  }, []);

  if (!user) {
    return (
      <div className="account-shell">
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-shell">
      <div className="container-fluid">
        <div className="profile-card">
          <div className="row g-0">
            <div className="col-md-4">
              <div className="profile-side">
                <div className="profile-avatar">{initials(user.name) || 'U'}</div>
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                {user.role === 'admin' && <span className="badge rounded-pill">Admin</span>}
                <div className="profile-card-actions">
                  <a href="/account/edit" className="btn custom-btn custom-btn-outline-light custom-btn-sm">
                    <i className="bi bi-pencil me-1"></i>Edit Profile
                  </a>
                  <a href="/account/security" className="btn custom-btn custom-btn-outline-light custom-btn-sm">
                    <i className="bi bi-key me-1"></i>Change Password
                  </a>
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <div className="profile-card-body">
                <div className="row">
                  <div className="col-sm-6">
                    <Field icon="bi-telephone" label="Phone" value={user.phone || ''} />
                  </div>
                  <div className="col-sm-6">
                    <Field icon="bi-geo-alt" label="City" value={user.city || ''} />
                  </div>
                  <div className="col-sm-6">
                    <Field icon="bi-house-door" label="Address" value={user.address || ''} />
                  </div>
                  <div className="col-sm-6">
                    <Field icon="bi-hash" label="Pincode" value={user.pincode || ''} />
                  </div>
                  <div className="col-sm-6">
                    <Field icon="bi-signpost-2" label="State / District" value={[user.stateName, user.districtName].filter(Boolean).join(' / ')} />
                  </div>
                  <div className="col-sm-6">
                    <Field icon="bi-signpost-2" label="Taluk" value={user.talukName || ''} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mt-4">
          {[
            { href: '/account/submissions', icon: 'bi-journal-text', label: 'My Submissions' },
            { href: '/account/purchases', icon: 'bi-collection', label: 'My Purchases' },
            { href: '/account/orders', icon: 'bi-box-seam', label: 'Hard Copy Orders' },
            { href: '/account/subscriptions', icon: 'bi-arrow-repeat', label: 'My Subscriptions' },
            { href: '/account/payments', icon: 'bi-receipt', label: 'Payments & Invoices' },
            { href: '/account/help-requests', icon: 'bi-life-preserver', label: 'Help Requests' }
          ].map((link) => (
            <div className="col-6 col-md-4 col-lg-2" key={link.href}>
              <a href={link.href} className="quick-link-card">
                <i className={`bi ${link.icon}`}></i>
                <span>{link.label}</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
