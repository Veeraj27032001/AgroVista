'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Tag,
  CreditCard,
  Users,
  Package,
  Undo2,
  Ticket,
  FileText,
  UserCog,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  LifeBuoy,
  Settings
} from 'lucide-react';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/content', label: 'Home Page Content', icon: LayoutTemplate },
  { href: '/admin/issues', label: 'Issues', icon: BookOpen },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/plans', label: 'Plans', icon: CreditCard },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/returns', label: 'Returns (legacy)', icon: Undo2 },
  { href: '/admin/support-requests', label: 'Help Requests', icon: LifeBuoy },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/submissions', label: 'Submissions', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: UserCog },
  { href: '/admin/settings', label: 'Settings', icon: Settings }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('admin_sidebar_collapsed') === '1');
    } catch {
      // ignore
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed w-16' : 'w-56'} shrink-0 border-r border-gray-200 bg-white py-6`}>
      <div className="mb-6 flex items-center justify-between px-4">
        <span className="admin-sidebar-brand-text font-serif text-lg font-bold text-primary">AgriOxen Admin</span>
        <button type="button" className="admin-sidebar-toggle" onClick={toggle} aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      <nav className="space-y-1 px-2">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                active ? 'bg-primary-light text-primary' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="admin-sidebar-label">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
