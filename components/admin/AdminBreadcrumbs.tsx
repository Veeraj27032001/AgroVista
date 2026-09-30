'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
  admin: 'Dashboard',
  issues: 'Issues',
  categories: 'Categories',
  coupons: 'Coupons',
  plans: 'Plans',
  subscriptions: 'Subscriptions',
  orders: 'Orders',
  returns: 'Returns',
  submissions: 'Submissions',
  users: 'Users',
  new: 'New'
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    href: '/' + segments.slice(0, i + 1).join('/'),
    label: UUID_RE.test(seg) ? 'Details' : LABELS[seg] || seg
  }));

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="breadcrumb" className="admin-breadcrumb-strip">
      <ol className="breadcrumb mb-0">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={c.href} className={`breadcrumb-item${isLast ? ' active' : ''}`} aria-current={isLast ? 'page' : undefined}>
              {isLast ? c.label : <Link href={c.href}>{c.label}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
