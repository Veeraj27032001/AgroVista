import { listPublishedIssues } from '@/lib/db/catalog';
import IssueGrid from '@/components/public/IssueGrid';

export const metadata = { title: 'Special Editions — AgroVista' };
export const dynamic = 'force-dynamic';

export default async function SpecialEditionsPage() {
  const { issues } = await listPublishedIssues({ specialEditionsOnly: true, pageSize: 48 });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Special Editions</h1>
      <IssueGrid issues={issues} emptyMessage="No special editions published yet." />
    </div>
  );
}
