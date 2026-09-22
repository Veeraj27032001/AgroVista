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
    getSession().then(setSession);
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
              <>
                <span className="me-2 small text-muted d-none d-lg-inline">{session.user?.name}</span>
                {session.user?.role === 'admin' && (
                  <a href="/admin" className="btn custom-btn custom-btn-secondary custom-btn-sm">
                    Admin
                  </a>
                )}
                <button
                  type="button"
                  className="btn custom-btn custom-btn-secondary custom-btn-sm"
                  onClick={() => logout()}
                >
                  Sign out
                </button>
              </>
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
