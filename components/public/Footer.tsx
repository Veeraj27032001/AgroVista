import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-black/5 bg-paper py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
              <Leaf className="h-5 w-5" />
              AgroVista
            </div>
            <p className="mt-3 text-sm text-gray-600">Independent reporting on agriculture technology, markets, sustainability and people.</p>
          </div>
          <div>
            <h5 className="mb-3 text-sm font-semibold">Explore</h5>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/archive">Archive</Link></li>
              <li><Link href="/special-editions">Special Editions</Link></li>
              <li><Link href="/subscribe">Subscribe</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-3 text-sm font-semibold">Contribute</h5>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/submit-article">Submit an Article</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-3 text-sm font-semibold">Your Account</h5>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/login">Sign In</Link></li>
              <li><Link href="/register">Register</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-black/5 pt-6 text-xs text-gray-500">© 2026 AgroVista. All rights reserved.</div>
      </div>
    </footer>
  );
}
