import '../globals.css';
import { requireAdminOrRedirect } from '@/lib/auth';
import { findUserById } from '@/lib/db/users';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminOrRedirect();
  const user = await findUserById(session.userId);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        {user && <AdminHeader user={user} />}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
