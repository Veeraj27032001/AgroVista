import { listPublishedIssues } from '@/lib/db/catalog';
import IssueGrid from '@/components/public/IssueGrid';

export const metadata = { title: 'Special Editions — AgriOxen' };
export const dynamic = 'force-dynamic';

export default async function SpecialEditionsPage() {
  const { issues } = await listPublishedIssues({ specialEditionsOnly: true, pageSize: 48 });
  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-[150px]">
      <h1 className="mb-6 text-3xl font-bold">Special Editions</h1>
      <IssueGrid issues={issues} emptyMessage="No special editions published yet." />
    </div>
  );
}
