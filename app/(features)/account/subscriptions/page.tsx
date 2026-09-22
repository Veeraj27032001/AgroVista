'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Subscription } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function AccountSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[] | null>(null);

  function load() {
    fetch('/api/subscriptions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setSubs(data.subscriptions || []));
  }

  useEffect(load, []);

  async function handleCancel(sub: Subscription) {
    const res = await fetch(`/api/subscriptions/${sub.id}/cancel`, { method: 'POST', credentials: 'include' });
    if (!res.ok) {
      toast.error('Could not cancel auto-renew.');
      return;
    }
    toast.success('Auto-renew turned off.');
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Subscriptions</h1>
      {!subs ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : subs.length === 0 ? (
        <p className="text-gray-500">You don&apos;t have any subscriptions yet.</p>
      ) : (
        <div className="space-y-3">
          {subs.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
              <div>
                <p className="font-semibold capitalize">{sub.format} copy</p>
                <p className="text-sm text-gray-500">
                  {sub.startDate} &rarr; {sub.endDate}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge label={sub.status} />
                {sub.status === 'active' && sub.autoRenew && (
                  <Button size="sm" variant="secondary" onClick={() => handleCancel(sub)}>
                    Turn off auto-renew
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
