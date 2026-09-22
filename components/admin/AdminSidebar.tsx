'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarRange,
  BookOpen,
  Sparkles,
  CreditCard,
  Users,
  Package,
  Undo2,
  Ticket,
  FileText,
  UserCog
} from 'lucide-react';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/years', label: 'Years & Volumes', icon: CalendarRange },
  { href: '/admin/issues', label: 'Issues', icon: BookOpen },
  { href: '/admin/special-editions', label: 'Special Editions', icon: Sparkles },
  { href: '/admin/plans', label: 'Plans', icon: CreditCard },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/returns', label: 'Returns', icon: Undo2 },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/submissions', label: 'Submissions', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: UserCog }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white py-6">
      <div className="mb-6 px-4 font-serif text-lg font-bold text-primary">AgroVista Admin</div>
      <nav className="space-y-1 px-2">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                active ? 'bg-primary-light text-primary' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
