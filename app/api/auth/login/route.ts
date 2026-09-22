import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { comparePassword, signSessionToken, SESSION_COOKIE_MAX_AGE_SECONDS } from '@/lib/auth';
import { findUserByEmail } from '@/lib/db/users';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body;

  const user = await findUserByEmail(String(email || ''));
  const valid = user ? await comparePassword(String(password || ''), user.passwordHash) : false;

  if (!user || !valid) {
    return NextResponse.json({ error: 'invalid_credentials', message: 'Incorrect email or password.' }, { status: 401 });
  }

  const token = signSessionToken({ userId: user.id, email: user.email, role: user.role });
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  res.cookies.set(config.sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    path: '/'
  });
  return res;
}
