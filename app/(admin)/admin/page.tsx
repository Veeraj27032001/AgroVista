import { listUsers } from '@/lib/db/users';
import { listAllSubscriptions } from '@/lib/db/subscriptions';
import { listAllOrders } from '@/lib/db/orders';
import { listReturnRequests } from '@/lib/db/orders';
import { listAllSubmissions } from '@/lib/db/submissions';
import StatCard from '@/components/admin/StatCard';
import Badge from '@/components/ui/Badge';

export default async function AdminDashboardPage() {
  const [users, subscriptions, orders, returns, submissions] = await Promise.all([
    listUsers(),
    listAllSubscriptions(),
    listAllOrders(),
    listReturnRequests(),
    listAllSubmissions()
  ]);

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending' || o.orderStatus === 'processing').length;
  const openReturns = returns.filter((r) => r.status === 'pending').length;
  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted' || s.status === 'resubmitted').length;
  const monthlyRevenue = orders
    .filter((o) => o.paymentStatus === 'paid' && new Date(o.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Active Subscriptions" value={activeSubscriptions} />
        <StatCard label="Pending Orders" value={pendingOrders} />
        <StatCard label="Open Returns" value={openReturns} />
        <StatCard label="Pending Submissions" value={pendingSubmissions} />
        <StatCard label="Monthly Revenue" value={`₹${monthlyRevenue}`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold">Recent Orders</h2>
          <div className="space-y-2">
            {orders.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <span>₹{o.amount}</span>
                <Badge label={o.orderStatus} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 font-semibold">Recent Submissions</h2>
          <div className="space-y-2">
            {submissions.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <span className="truncate">{s.title}</span>
                <Badge label={s.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
