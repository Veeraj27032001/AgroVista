'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SupportRequest } from '@/lib/db/support-requests';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

export default function HelpRequestsPage() {
  const [requests, setRequests] = useState<SupportRequest[] | null>(null);

  useEffect(() => {
    fetch('/api/support-requests', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setRequests(data.requests || []));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Help Requests</h1>
      {!requests ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">No help requests yet.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Link key={r.id} href={`/account/help-requests/${r.id}`} className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:border-primary">
              <div>
                <p className="font-semibold">{r.requestNumber}</p>
                <p className="text-sm text-gray-500">{r.type.replace(/_/g, ' ')}</p>
              </div>
              <Badge label={r.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
