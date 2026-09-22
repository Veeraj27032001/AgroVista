import ArchiveClient from '@/components/public/ArchiveClient';

export const metadata = { title: 'Archive — AgroVista' };

export default function ArchivePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Magazine Archive</h1>
      <ArchiveClient />
    </div>
  );
}
