import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { verifyOtpToken, signSessionToken, SESSION_COOKIE_MAX_AGE_SECONDS, OTP_COOKIE_NAME } from '@/lib/auth';
import { findUserById } from '@/lib/db/users';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || '').trim();
  if (!code) return NextResponse.json({ error: 'missing_code' }, { status: 400 });

  const token = req.cookies.get(OTP_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'expired', message: 'This code has expired. Request a new one.' }, { status: 400 });
  }

  const payload = verifyOtpToken(token);
  if (!payload || payload.code !== code) {
    return NextResponse.json({ error: 'invalid_code', message: 'Incorrect code. Please try again.' }, { status: 400 });
  }

  const user = await findUserById(payload.userId);
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  res.cookies.set(config.sessionCookieName, signSessionToken({ userId: user.id, email: user.email, role: user.role }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    path: '/'
  });
  res.cookies.set(OTP_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return res;
}
