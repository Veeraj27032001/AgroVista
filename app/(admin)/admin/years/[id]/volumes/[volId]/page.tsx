'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Issue, IssueSlot } from '@/lib/types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

export default function AdminVolumeDetailPage({ params }: { params: Promise<{ id: string; volId: string }> }) {
  const { volId } = use(params);
  const [slots, setSlots] = useState<IssueSlot[] | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [slotNumber, setSlotNumber] = useState('');
  const [month, setMonth] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    Promise.all([
      fetch(`/api/admin/slots?volumeId=${volId}`, { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/admin/issues', { credentials: 'include' }).then((r) => r.json())
    ]).then(([slotData, issueData]) => {
      setSlots(slotData.slots || []);
      setIssues(issueData.issues || []);
    });
  }

  useEffect(load, [volId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/admin/slots', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volumeId: volId, slotNumber: Number(slotNumber), month: month ? Number(month) : undefined })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not create slot.');
      return;
    }
    setSlotNumber('');
    setMonth('');
    load();
  }

  function slotStatus(slot: IssueSlot): { label: string; issue?: Issue } {
    const issue = issues.find((i) => i.slotId === slot.id);
    if (!issue) return { label: 'empty' };
    return { label: issue.status, issue };
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Issue Slots</h1>
      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-3">
        <Input label="Slot #" value={slotNumber} onChange={(e) => setSlotNumber(e.target.value)} className="w-28" />
        <Select
          label="Month"
          placeholder="None"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }) }))}
        />
        <Button type="submit" loading={busy}>
          Add Slot
        </Button>
      </form>

      {!slots ? (
        <Spinner />
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => {
            const status = slotStatus(slot);
            return (
              <div key={slot.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                <div>
                  <p className="font-semibold">Slot {slot.slotNumber}</p>
                  {slot.month && <p className="text-sm text-gray-500">{new Date(2000, slot.month - 1, 1).toLocaleString('default', { month: 'long' })}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={status.label} />
                  {status.issue ? (
                    <Link href={`/admin/issues/${status.issue.id}`}>
                      <Button size="sm" variant="secondary">
                        Edit Issue
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/admin/issues/new?slotId=${slot.id}`}>
                      <Button size="sm">Publish Issue</Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
