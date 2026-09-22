import type { Issue } from '@/lib/types';
import IssueCard from './IssueCard';

export default function IssueGrid({ issues, emptyMessage = 'No issues found.' }: { issues: Issue[]; emptyMessage?: string }) {
  if (issues.length === 0) {
    return <p className="py-16 text-center text-gray-500">{emptyMessage}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {issues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}
