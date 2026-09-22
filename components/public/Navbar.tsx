'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Leaf, ShoppingCart, User as UserIcon } from 'lucide-react';
import { getSession, logout, type SessionResponse } from '@/lib/client/session';
import { useCart } from '@/lib/client/cart';

export default function Navbar() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const cart = useCart();

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  return (
    <nav className="fixed top-0 z-40 w-full border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold text-primary">
          <Leaf className="h-6 w-6" />
          AgroVista
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/archive" className="hover:text-primary">
            Archive
          </Link>
          <Link href="/special-editions" className="hover:text-primary">
            Special Editions
          </Link>
          <Link href="/subscribe" className="hover:text-primary">
            Subscribe
          </Link>
          <Link href="/submit-article" className="hover:text-primary">
            Submit Article
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/cart" className="relative rounded-full p-2 hover:bg-primary-light">
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                {cart.length}
              </span>
            )}
          </Link>

          {session === null ? null : session.authenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/account" className="flex items-center gap-1 rounded-full p-2 hover:bg-primary-light">
                <UserIcon className="h-5 w-5" />
                <span className="hidden text-sm md:inline">{session.user?.name}</span>
              </Link>
              {session.user?.role === 'admin' && (
                <Link href="/admin" className="rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary">
                  Admin
                </Link>
              )}
              <button onClick={() => logout()} className="rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary">
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
