'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Volume } from '@/lib/types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function AdminYearDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: yearId } = use(params);
  const [volumes, setVolumes] = useState<Volume[] | null>(null);
  const [volumeNumber, setVolumeNumber] = useState('');
  const [quarter, setQuarter] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/admin/volumes?yearId=${yearId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setVolumes(data.volumes || []));
  }

  useEffect(load, [yearId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/admin/volumes', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yearId, volumeNumber: Number(volumeNumber), quarter: quarter || undefined })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not create volume.');
      return;
    }
    setVolumeNumber('');
    setQuarter('');
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Volumes</h1>
      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-3">
        <Input label="Volume #" value={volumeNumber} onChange={(e) => setVolumeNumber(e.target.value)} className="w-28" />
        <Select
          label="Quarter"
          placeholder="None"
          value={quarter}
          onChange={(e) => setQuarter(e.target.value)}
          options={['Q1', 'Q2', 'Q3', 'Q4'].map((q) => ({ value: q, label: q }))}
        />
        <Button type="submit" loading={busy}>
          Add Volume
        </Button>
      </form>

      {!volumes ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {volumes.map((v) => (
            <Link
              key={v.id}
              href={`/admin/years/${yearId}/volumes/${v.id}`}
              className="rounded-xl border border-gray-200 p-6 text-center font-semibold hover:border-primary"
            >
              Volume {v.volumeNumber}
              {v.quarter && <div className="text-xs text-gray-500">{v.quarter}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
