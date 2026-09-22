'use client';

import { useEffect, useState } from 'react';
import type { Issue } from '@/lib/types';

const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu'];

function lowestPrice(issue: Issue): number | null {
  const prices = [issue.softCopyRate, issue.hardCopyRate, issue.bothRate].filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

function cardHtml(issue: Issue) {
  const price = lowestPrice(issue);
  return (
    <div className="col-lg-3 col-md-6 col-12 issue-col" key={issue.id}>
      <div className="issue-card">
        <div className="issue-card-cover">
          <span className="issue-card-tag">{issue.language}</span>
          <a href={`/issues/${issue.id}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={issue.posterUrl || 'https://placehold.co/600x800/4C7A3F/ffffff?text=AgroVista'} alt={issue.title} />
          </a>
        </div>
        <div className="issue-card-body">
          <div className="issue-card-meta">
            {issue.publishedAt ? new Date(issue.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
          </div>
          <h3 className="issue-card-title" style={{ fontSize: 16 }}>
            <a href={`/issues/${issue.id}`}>{issue.title}</a>
          </h3>
          <div className="mt-2">
            <a href={`/issues/${issue.id}`} className="btn custom-btn custom-btn-sm">
              <i className="bi bi-unlock me-1"></i>
              {price !== null ? `Unlock & Read — ₹${price}` : 'View Issue'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArchiveClient() {
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [language, setLanguage] = useState('');
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
    params.set('pageSize', '48');

    fetch(`/api/issues?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setIssues(data.issues || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [search, year, language]);

  function resetFilters() {
    setSearch('');
    setYear('');
    setLanguage('');
  }

  return (
    <div className="container">
      <div className="search-panel">
        <div className="row g-3 align-items-end">
          <div className="col-lg-5 col-md-6 col-12">
            <label className="form-label" htmlFor="search-input">
              Search by title or keyword
            </label>
            <div className="search-input-wrap">
              <i className="bi bi-search"></i>
              <input
                type="text"
                id="search-input"
                className="form-control"
                placeholder="e.g. irrigation, drones, dairy…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-lg-3 col-md-6 col-6">
            <label className="form-label" htmlFor="filter-year">
              Year
            </label>
            <input
              type="text"
              id="filter-year"
              className="form-control"
              placeholder="e.g. 2026"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div className="col-lg-4 col-md-6 col-6">
            <label className="form-label" htmlFor="filter-language">
              Language
            </label>
            <select id="filter-language" className="form-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">All Languages</option>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 pt-3 border-top">
          <span className="results-count">
            {loading ? 'Loading issues…' : total === issues.length ? `Showing all ${total} issues` : `Showing ${issues.length} of ${total} issues`}
          </span>
          <button type="button" className="btn custom-btn custom-btn-secondary custom-btn-sm" onClick={resetFilters}>
            <i className="bi bi-x-circle me-1"></i> Clear Filters
          </button>
        </div>
      </div>

      <section className="pb-5">
        {loading ? (
          <div className="col-12 text-center text-muted py-5">
            <i className="bi bi-arrow-repeat"></i> Loading issues…
          </div>
        ) : issues.length > 0 ? (
          <div className="row g-4">{issues.map(cardHtml)}</div>
        ) : (
          <div className="no-results">
            <i className="bi bi-journal-x"></i>
            <h5>No issues found</h5>
            <p className="mb-0">Try a different keyword or clear your filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}
