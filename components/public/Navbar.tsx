'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSession, logout, type SessionResponse } from '@/lib/client/session';
import { useCart } from '@/lib/client/cart';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#about', label: 'About' },
  { href: '/#categories', label: 'Categories' },
  { href: '/archive', label: 'Archive' },
  { href: '/subscribe', label: 'Subscribe' },
  { href: '/#contact', label: 'Contact' }
];

export default function Navbar() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const cart = useCart();

  useEffect(() => {
    getSession()
      .then(setSession)
      .catch(() => setSession({ authenticated: false }));
  }, []);

  return (
    <nav className={`navbar navbar-expand-lg fixed-top${isHome ? '' : ' scrolled'}`}>
      <div className="container">
        <a className="navbar-brand" href="/">
          <span className="navbar-brand-mark">
            <i className="bi bi-flower1"></i>
          </span>
          <span className="navbar-brand-text">
            AgriOxen<small>Monthly Magazine</small>
          </span>
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-lg-auto align-items-lg-center">
            {NAV_LINKS.map((link) => (
              <li className="nav-item" key={link.href}>
                <a className={`nav-link${pathname === link.href ? ' active' : ''}`} href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="ms-lg-3 mt-3 mt-lg-0 d-flex align-items-center gap-2">
            <a href="/cart" className="position-relative d-inline-flex align-items-center text-decoration-none" style={{ color: 'var(--dark-color)' }}>
              <i className="bi bi-cart3" style={{ fontSize: 20 }}></i>
              {cart.length > 0 && (
                <span
                  className="position-absolute badge rounded-pill"
                  style={{ top: -6, left: 14, background: 'var(--custom-btn-bg-color)', color: '#fff', fontSize: 10 }}
                >
                  {cart.length}
                </span>
              )}
            </a>
            {session === null ? null : session.authenticated ? (
              <div className="dropdown">
                <button
                  type="button"
                  className="btn custom-btn custom-btn-secondary custom-btn-sm dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle me-1"></i> {session.user?.name}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li className="px-3 py-1">
                    <div className="small fw-semibold">{session.user?.name}</div>
                    <div className="small text-muted text-truncate">{session.user?.email}</div>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <a className="dropdown-item" href="/account">
                      <i className="bi bi-person me-2"></i>Profile
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/submit-article">
                      <i className="bi bi-file-earmark-text me-2"></i>Submit Article
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/account/submissions">
                      <i className="bi bi-journal-text me-2"></i>My Submissions
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/account/purchases">
                      <i className="bi bi-collection me-2"></i>My Purchases
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/account/orders">
                      <i className="bi bi-box-seam me-2"></i>Hard Copy Orders
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/account/subscriptions">
                      <i className="bi bi-arrow-repeat me-2"></i>My Subscriptions
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/account/payments">
                      <i className="bi bi-receipt me-2"></i>Payments &amp; Invoices
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/account/help-requests">
                      <i className="bi bi-life-preserver me-2"></i>Help Requests
                    </a>
                  </li>
                  {session.user?.role === 'admin' && (
                    <li>
                      <a className="dropdown-item" href="/admin">
                        <i className="bi bi-speedometer2 me-2"></i>Admin Dashboard
                      </a>
                    </li>
                  )}
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button type="button" className="dropdown-item text-danger" onClick={() => logout()}>
                      <i className="bi bi-box-arrow-right me-2"></i>Sign out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <a href="/login" className="btn custom-btn custom-btn-secondary custom-btn-sm">
                Sign in
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
