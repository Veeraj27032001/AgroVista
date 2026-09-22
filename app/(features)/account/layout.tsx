import Link from 'next/link';
import { requireUserOrRedirect } from '@/lib/auth';

const LINKS = [
  { href: '/account', label: 'Profile' },
  { href: '/account/subscriptions', label: 'Subscriptions' },
  { href: '/account/purchases', label: 'Purchases' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/submissions', label: 'Submissions' }
];

export const dynamic = 'force-dynamic';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUserOrRedirect();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <aside className="space-y-1">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-primary-light hover:text-primary">
              {link.label}
            </Link>
          ))}
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
