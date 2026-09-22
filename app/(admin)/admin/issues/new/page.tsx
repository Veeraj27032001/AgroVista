'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import IssueForm from '@/components/admin/IssueForm';

function NewIssueInner() {
  const searchParams = useSearchParams();
  const slotId = searchParams.get('slotId') || undefined;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New Issue</h1>
      <IssueForm slotId={slotId} onSaved={(issue) => (window.location.href = `/admin/issues/${issue.id}`)} />
    </div>
  );
}

export default function NewIssuePage() {
  return (
    <Suspense>
      <NewIssueInner />
    </Suspense>
  );
}
