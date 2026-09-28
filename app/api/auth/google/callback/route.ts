import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { signSessionToken, SESSION_COOKIE_MAX_AGE_SECONDS } from '@/lib/auth';
import { createUser, findUserByEmail } from '@/lib/db/users';
import type { User } from '@/lib/types';

function fail(req: NextRequest, reason: string) {
  const res = NextResponse.redirect(new URL(`/login?error=${reason}`, req.url));
  res.cookies.delete('google_oauth_state');
  return res;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const stateCookie = req.cookies.get('google_oauth_state')?.value;

  if (!code || !state || !stateCookie) return fail(req, 'google_failed');

  let expected: { state: string; redirect: string };
  try {
    expected = JSON.parse(stateCookie);
  } catch {
    return fail(req, 'google_failed');
  }
  if (state !== expected.state) return fail(req, 'google_failed');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      code,
      redirect_uri: `${config.appUrl}/api/auth/google/callback`,
      grant_type: 'authorization_code'
    })
  });
  if (!tokenRes.ok) return fail(req, 'google_failed');
  const tokens = (await tokenRes.json()) as { access_token: string };

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  if (!profileRes.ok) return fail(req, 'google_failed');
  const profile = (await profileRes.json()) as { email: string; email_verified: boolean; name?: string };

  if (!profile.email || !profile.email_verified) return fail(req, 'google_email_unverified');

  let user: User | null = await findUserByEmail(profile.email);
  if (!user) {
    user = await createUser({ name: profile.name || profile.email.split('@')[0], email: profile.email });
  }

  const token = signSessionToken({ userId: user.id, email: user.email, role: user.role });
  const res = NextResponse.redirect(new URL(expected.redirect || '/', req.url));
  res.cookies.set(config.sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    path: '/'
  });
  res.cookies.delete('google_oauth_state');
  return res;
}
