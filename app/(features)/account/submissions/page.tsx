'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ArticleSubmission } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<ArticleSubmission[] | null>(null);

  useEffect(() => {
    fetch('/api/submissions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setSubmissions(data.submissions || []));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Submissions</h1>
        <Link href="/submit-article" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
          + Submit New Article
        </Link>
      </div>
      {!submissions ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-gray-500">You haven&apos;t submitted any articles yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Article ID', 'Title', 'Theme', 'Date', 'Status', 'Payment', 'Publication'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/account/submissions/${s.id}`} className="font-medium text-primary">
                      {s.articleCode || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{s.title}</td>
                  <td className="whitespace-nowrap px-4 py-3">{s.theme === 'Other' ? s.themeOther : s.theme}</td>
                  <td className="whitespace-nowrap px-4 py-3">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge label={s.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {s.publicationCharge ? `₹${s.amountPaid} / ₹${s.publicationCharge}` : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {s.status === 'published' ? `Vol ${s.volumeNumber}, Issue ${s.issueNumber}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
