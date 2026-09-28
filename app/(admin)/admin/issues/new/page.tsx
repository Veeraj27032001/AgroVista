'use client';

import IssueForm from '@/components/admin/IssueForm';

export default function NewIssuePage() {
  return <IssueForm formTitle="New Issue" onSaved={(issue) => (window.location.href = `/admin/issues/${issue.id}`)} />;
}
