import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(config.sessionCookieName, '', { maxAge: 0, path: '/' });
  return res;
}
