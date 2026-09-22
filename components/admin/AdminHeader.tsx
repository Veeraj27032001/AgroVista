'use client';

import { logout } from '@/lib/client/session';
import type { User } from '@/lib/types';

export default function AdminHeader({ user }: { user: User }) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <span className="text-sm text-gray-500">Signed in as {user.email}</span>
      <button onClick={() => logout()} className="rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary">
        Sign out
      </button>
    </header>
  );
}
