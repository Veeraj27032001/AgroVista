'use client';

import type { User } from '@/lib/types';

export type SessionResponse = { authenticated: boolean; user?: User };

export async function getSession(): Promise<SessionResponse> {
  const res = await fetch('/api/me', { credentials: 'include' });
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
}
