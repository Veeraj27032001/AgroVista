import Link from 'next/link';
import type { Issue } from '@/lib/types';

function lowestPrice(issue: Issue): number | null {
  const prices = [issue.softCopyRate, issue.hardCopyRate, issue.bothRate].filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

export default function IssueCard({ issue }: { issue: Issue }) {
  const price = lowestPrice(issue);
  return (
    <Link href={`/issues/${issue.id}`} className="group block overflow-hidden rounded-2xl border border-gray-100 shadow-sm transition hover:shadow-md">
      <div className="aspect-[3/4] overflow-hidden bg-primary-light">
        {issue.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={issue.posterUrl} alt={issue.title} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-primary/40">No cover</div>
        )}
      </div>
      <div className="p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">{issue.language}</span>
        <h3 className="mt-1 line-clamp-2 font-serif text-base font-bold">{issue.title}</h3>
        <p className="mt-2 text-sm text-gray-500">{price !== null ? `From ₹${price}` : 'Pricing unavailable'}</p>
      </div>
    </Link>
  );
}
