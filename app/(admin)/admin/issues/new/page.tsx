'use client';

import IssueForm from '@/components/admin/IssueForm';

export default function NewIssuePage() {
  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: 24 }}>
        New Issue
      </h1>
      <IssueForm onSaved={(issue) => (window.location.href = `/admin/issues/${issue.id}`)} />
    </div>
  );
}
