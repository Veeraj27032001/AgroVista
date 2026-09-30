import '../globals.css';
import { requireAdminOrRedirect } from '@/lib/auth';
import Navbar from '@/components/public/Navbar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminOrRedirect();

  return (
    <>
      <link rel="stylesheet" href="/css/admin.css" />
      <Navbar />
      <div className="pt-[90px]">
        <AdminBreadcrumbs />
        <div className="flex min-h-screen bg-paper">
          <AdminSidebar />
          <div className="flex-1">
            <main className="p-6">{children}</main>
          </div>
        </div>
      </div>
    </>
  );
}
