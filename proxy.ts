import { NextRequest, NextResponse } from 'next/server';

// This runs in the Edge runtime, which can't verify the JWT signature (that
// needs Node's crypto, used by jsonwebtoken in lib/auth.ts). So this layer only
// does a cheap "is there a session cookie at all" redirect for a fast UX bounce
// to /login. The actual signature + role check happens server-side in Node.js
// on every protected page/route via getSession() — that's the real boundary.
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'agrovista_session';

const PROTECTED_PREFIXES = ['/admin', '/account', '/checkout', '/submit-article'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!needsAuth) return NextResponse.next();

  const hasCookie = req.cookies.has(SESSION_COOKIE_NAME);
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout/:path*', '/submit-article']
};
