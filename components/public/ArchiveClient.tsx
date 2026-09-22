'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { Issue } from '@/lib/types';
import IssueGrid from './IssueGrid';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Pagination from '../ui/Pagination';
import Spinner from '../ui/Spinner';

const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu'];

export default function ArchiveClient() {
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [language, setLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (year) params.set('year', year);
    if (language) params.set('language', language);
    params.set('page', String(page));

    fetch(`/api/issues?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setIssues(data.issues || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [search, year, language, page]);

  const totalPages = Math.max(1, Math.ceil(total / 24));

  return (
    <div>
      <div className="mb-8 grid gap-3 rounded-2xl border border-gray-200 p-4 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by title or keyword"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <Input
          placeholder="Year (e.g. 2026)"
          value={year}
          onChange={(e) => {
            setPage(1);
            setYear(e.target.value);
          }}
        />
        <Select
          placeholder="All Languages"
          options={LANGUAGES.map((l) => ({ value: l, label: l }))}
          value={language}
          onChange={(e) => {
            setPage(1);
            setLanguage(e.target.value);
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          <IssueGrid issues={issues} />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
