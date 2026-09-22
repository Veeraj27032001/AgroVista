import Link from 'next/link';
import { listPublishedIssues } from '@/lib/db/catalog';
import { listActivePlans } from '@/lib/db/subscriptions';
import IssueGrid from '@/components/public/IssueGrid';

// The catalog changes whenever an issue is published, and pre-rendering this
// at build time would also require live Supabase credentials to be present
// at build time — render per-request instead.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [{ issues }, plans] = await Promise.all([listPublishedIssues({ page: 1, pageSize: 6 }), listActivePlans()]);
  const latest = issues[0];

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-light to-white py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">New issue every month</span>
            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">Stories &amp; data shaping the future of agriculture.</h1>
            <p className="mt-4 text-gray-600">
              Technology, markets, sustainability and the people growing the world&apos;s food — subscribe or unlock any issue to read online.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/subscribe" className="rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-hover">
                Subscribe Now
              </Link>
              <Link href="/archive" className="rounded-full border border-primary px-6 py-3 font-semibold text-primary">
                Browse Archive
              </Link>
            </div>
          </div>
          {latest && (
            <Link href={`/issues/${latest.id}`} className="mx-auto block max-w-xs overflow-hidden rounded-2xl shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={latest.posterUrl || undefined} alt={latest.title} className="aspect-[3/4] w-full object-cover" />
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Recently Published</h2>
          <Link href="/archive" className="text-sm font-semibold text-primary">
            View all &rarr;
          </Link>
        </div>
        <IssueGrid issues={issues} emptyMessage="No issues published yet." />
      </section>

      {plans.length > 0 && (
        <section className="bg-paper py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-6 text-2xl font-bold">Subscription Plans</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.slice(0, 3).map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-gray-200 bg-white p-6">
                  <span className="text-xs font-semibold uppercase text-primary">{plan.format} copy</span>
                  <h3 className="mt-1 font-serif text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-gray-500">{plan.durationLabel}</p>
                  <p className="mt-3 text-2xl font-bold">₹{plan.price}</p>
                </div>
              ))}
            </div>
            <Link href="/subscribe" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-white">
              See all plans
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
