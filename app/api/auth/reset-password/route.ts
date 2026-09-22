import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyPasswordResetToken } from '@/lib/auth';
import { findUserById, updateUserPasswordHash } from '@/lib/db/users';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { token, password } = body as { token?: string; password?: string };

  if (!token) return NextResponse.json({ error: 'missing_token' }, { status: 400 });
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'weak_password', message: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const payload = verifyPasswordResetToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'expired_or_invalid', message: 'This reset link has expired or already been used. Request a new one.' },
      { status: 400 }
    );
  }

  const user = await findUserById(payload.userId);
  if (!user) {
    return NextResponse.json({ error: 'not_found', message: 'This account no longer exists.' }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  await updateUserPasswordHash(user.id, passwordHash);

  return NextResponse.json({ ok: true });
}
