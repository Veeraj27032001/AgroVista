'use client';

import { use, useEffect, useState } from 'react';
import type { Issue } from '@/lib/types';
import IssueForm from '@/components/admin/IssueForm';
import Spinner from '@/components/ui/Spinner';

export default function EditIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [issue, setIssue] = useState<Issue | null>(null);

  useEffect(() => {
    fetch(`/api/admin/issues/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setIssue(data.issue));
  }, [id]);

  if (!issue) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Issue</h1>
      <IssueForm existing={issue} onSaved={setIssue} />
    </div>
  );
}
