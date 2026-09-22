import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { findUserById } from '@/lib/db/users';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ authenticated: false });

  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ authenticated: false });

  return NextResponse.json({ authenticated: true, user });
}
