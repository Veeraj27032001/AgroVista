import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// This runs in the Edge runtime, which can't verify the JWT signature (that
// needs Node's crypto, used by jsonwebtoken in lib/auth.ts). So this layer only
// does a cheap "is there a session cookie at all" redirect for a fast UX bounce
// to /login, plus an opportunistic (unverified) role peek for the Editor
// sub-path restriction below. The actual signature + role check happens
// server-side in Node.js on every protected page/route via getSession() —
// that's the real boundary.
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'agrovista_session';

const PROTECTED_PREFIXES = ['/admin', '/account', '/checkout', '/submit-article'];
const EDITOR_ALLOWED_EXACT = ['/admin'];
const EDITOR_ALLOWED_PREFIXES = ['/admin/submissions'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (needsAuth && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/admin') && token) {
    let role: string | undefined;
    try {
      role = (jwt.decode(token) as { role?: string } | null)?.role;
    } catch {
      role = undefined;
    }
    if (role === 'editor') {
      const allowed = EDITOR_ALLOWED_EXACT.includes(pathname) || EDITOR_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p));
      if (!allowed) return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout/:path*', '/submit-article']
};
