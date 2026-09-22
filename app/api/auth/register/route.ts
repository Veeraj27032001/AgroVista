import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { hashPassword, signSessionToken, SESSION_COOKIE_MAX_AGE_SECONDS } from '@/lib/auth';
import { createUser, findUserByEmail } from '@/lib/db/users';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password, phone, address, city, state, pincode } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'invalid_name', message: 'Please enter your name.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(String(email || ''))) {
    return NextResponse.json({ error: 'invalid_email', message: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!password || String(password).length < 8) {
    return NextResponse.json(
      { error: 'weak_password', message: 'Password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'email_taken', message: 'An account with this email already exists.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash, phone, address, city, state, pincode });

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
