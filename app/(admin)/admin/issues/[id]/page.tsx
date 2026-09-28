'use client';

import { use, useEffect, useState } from 'react';
import type { Issue } from '@/lib/types';
import IssueForm from '@/components/admin/IssueForm';

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
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: 24 }}>
        Edit Issue
      </h1>
      <IssueForm existing={issue} onSaved={setIssue} />
    </div>
  );
}
