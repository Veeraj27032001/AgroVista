'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Category, Issue, PublicationYear, Volume } from '@/lib/types';

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
          <span className="issue-card-tag">{issue.categoryName || issue.language}</span>
          <a href={`/issues/${issue.id}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={issue.posterUrl || 'https://placehold.co/600x800/4C7A3F/ffffff?text=AgroVista'} alt={issue.title} />
          </a>
        </div>
        <div className="issue-card-body">
          <div className="issue-card-meta">
            {issue.publishedAt ? new Date(issue.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
            {issue.volumeNumber ? ` · Vol ${issue.volumeNumber}` : ''}
            {issue.slotNumber ? `, No ${issue.slotNumber}` : ''}
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
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [years, setYears] = useState<PublicationYear[]>([]);
  const [yearId, setYearId] = useState('');
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [volumeId, setVolumeId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySlug, setCategorySlug] = useState(searchParams.get('category') || '');
  const [language, setLanguage] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/years')
      .then((r) => r.json())
      .then((data) => setYears(data.years || []));
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  useEffect(() => {
    setVolumeId('');
    if (!yearId) {
      setVolumes([]);
      return;
    }
    fetch(`/api/volumes?yearId=${yearId}`)
      .then((r) => r.json())
      .then((data) => setVolumes(data.volumes || []));
  }, [yearId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const year = years.find((y) => y.id === yearId)?.year;
    if (year) params.set('year', String(year));
    if (volumeId) params.set('volumeId', volumeId);
    if (categorySlug) params.set('categorySlug', categorySlug);
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
  }, [search, yearId, volumeId, categorySlug, language, years]);

  function resetFilters() {
    setSearch('');
    setYearId('');
    setVolumeId('');
    setCategorySlug('');
    setLanguage('');
  }

  return (
    <div className="container">
      <div className="search-panel">
        <div className="row g-3 align-items-end">
          <div className="col-lg-4 col-md-6 col-12">
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
          <div className="col-lg-2 col-md-6 col-6">
            <label className="form-label" htmlFor="filter-year">
              Year
            </label>
            <select id="filter-year" className="form-select" value={yearId} onChange={(e) => setYearId(e.target.value)}>
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.year}
                </option>
              ))}
            </select>
          </div>
          <div className="col-lg-2 col-md-6 col-6">
            <label className="form-label" htmlFor="filter-volume">
              Volume
            </label>
            <select
              id="filter-volume"
              className="form-select"
              value={volumeId}
              onChange={(e) => setVolumeId(e.target.value)}
              disabled={!yearId}
            >
              <option value="">All Volumes</option>
              {volumes.map((v) => (
                <option key={v.id} value={v.id}>
                  Volume {v.volumeNumber}
                </option>
              ))}
            </select>
          </div>
          <div className="col-lg-2 col-md-6 col-6">
            <label className="form-label" htmlFor="filter-category">
              Category
            </label>
            <select
              id="filter-category"
              className="form-select"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-lg-2 col-md-6 col-6">
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
