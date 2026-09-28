import { NextRequest, NextResponse } from 'next/server';
import { getSession, comparePassword, hashPassword } from '@/lib/auth';
import { findUserByEmail, updateUserPasswordHash } from '@/lib/db/users';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'weak_password', message: 'New password must be at least 8 characters.' }, { status: 400 });
  }

  const user = await findUserByEmail(session.email);
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!user.passwordHash) {
    return NextResponse.json({ error: 'google_account', message: 'This account uses Google sign-in and has no password to change.' }, { status: 400 });
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'invalid_password', message: 'Current password is incorrect.' }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await updateUserPasswordHash(user.id, passwordHash);

  return NextResponse.json({ ok: true });
}
