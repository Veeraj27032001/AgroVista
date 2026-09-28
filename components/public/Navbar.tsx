'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSession, logout, type SessionResponse } from '@/lib/client/session';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#about', label: 'About' },
  { href: '/#categories', label: 'Categories' },
  { href: '/archive', label: 'Archive' },
  { href: '/#contact', label: 'Contact' }
];

export default function Navbar() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const pathname = usePathname();
  const isHome = pathname === '/';

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
            AgroVista<small>Monthly Magazine</small>
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
