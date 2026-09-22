'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { PublicationYear } from '@/lib/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function AdminYearsPage() {
  const [years, setYears] = useState<PublicationYear[] | null>(null);
  const [newYear, setNewYear] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    fetch('/api/admin/years', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setYears(data.years || []));
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/admin/years', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: Number(newYear) })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not create year.');
      return;
    }
    setNewYear('');
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Publication Years</h1>
      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <Input placeholder="e.g. 2027" value={newYear} onChange={(e) => setNewYear(e.target.value)} className="w-40" />
        <Button type="submit" loading={busy}>
          Add Year
        </Button>
      </form>

      {!years ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {years.map((y) => (
            <Link key={y.id} href={`/admin/years/${y.id}`} className="rounded-xl border border-gray-200 p-6 text-center text-xl font-bold hover:border-primary">
              {y.year}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
