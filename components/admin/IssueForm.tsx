'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Category, Issue } from '@/lib/types';

export default function IssueForm({ existing, onSaved }: { existing?: Issue; onSaved: (issue: Issue) => void }) {
  const [year, setYear] = useState(existing?.year?.toString() || '');
  const [volumeNumber, setVolumeNumber] = useState(existing?.volumeNumber?.toString() || '');
  const [slotNumber, setSlotNumber] = useState(existing?.slotNumber?.toString() || '');
  const [isSpecialEdition, setIsSpecialEdition] = useState(existing?.isSpecialEdition ?? false);
  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [language, setLanguage] = useState(existing?.language || 'English');
  const [categoryId, setCategoryId] = useState(existing?.categoryId || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [softCopyRate, setSoftCopyRate] = useState(existing?.softCopyRate?.toString() || '');
  const [hardCopyRate, setHardCopyRate] = useState(existing?.hardCopyRate?.toString() || '');
  const [bothRate, setBothRate] = useState(existing?.bothRate?.toString() || '');
  const [couponApplicable, setCouponApplicable] = useState(existing?.couponApplicable ?? true);
  const [status, setStatus] = useState(existing?.status || 'draft');
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [poster, setPoster] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/categories', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    const form = new FormData();
    form.set('title', title);
    form.set('description', description);
    form.set('language', language);
    form.set('isSpecialEdition', String(isSpecialEdition));
    if (categoryId) form.set('categoryId', categoryId);
    if (softCopyRate) form.set('softCopyRate', softCopyRate);
    if (hardCopyRate) form.set('hardCopyRate', hardCopyRate);
    if (bothRate) form.set('bothRate', bothRate);
    form.set('couponApplicable', String(couponApplicable));
    form.set('status', status);
    if (existing) form.set('isActive', String(isActive));
    if (poster) form.set('poster', poster);
    if (pdf) form.set('pdf', pdf);

    let res: Response;
    if (existing) {
      res = await fetch(`/api/admin/issues/${existing.id}`, { method: 'PATCH', credentials: 'include', body: form });
    } else {
      form.set('year', year);
      form.set('volumeNumber', volumeNumber);
      form.set('slotNumber', slotNumber);
      res = await fetch('/api/admin/issues', { method: 'POST', credentials: 'include', body: form });
    }

    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message || 'Could not save issue.');
      return;
    }
    toast.success('Saved');
    onSaved(data.issue);
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 720 }}>
      {!existing && (
        <div className="row g-3 mb-3">
          <div className="col-4">
            <label className="form-label">Year</label>
            <input type="number" className="form-control" required value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2026" />
          </div>
          <div className="col-4">
            <label className="form-label">Volume No.</label>
            <input
              type="number"
              className="form-control"
              required
              value={volumeNumber}
              onChange={(e) => setVolumeNumber(e.target.value)}
              placeholder="e.g. 1"
            />
          </div>
          <div className="col-4">
            <label className="form-label">Issue No.</label>
            <input
              type="number"
              className="form-control"
              required
              value={slotNumber}
              onChange={(e) => setSlotNumber(e.target.value)}
              placeholder="e.g. 1"
            />
          </div>
        </div>
      )}

      <div className="form-check mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          id="issue-special"
          checked={isSpecialEdition}
          onChange={(e) => setIsSpecialEdition(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="issue-special">
          Special Edition
        </label>
      </div>

      <div className="mb-3">
        <label className="form-label">Title</label>
        <input className="form-control" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="mb-3">
        <label className="form-label">Description</label>
        <textarea className="form-control" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">Language</label>
          <select className="form-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu'].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Category</label>
          <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">Poster Image</label>
          <input type="file" className="form-control" accept="image/*" onChange={(e) => setPoster(e.target.files?.[0] || null)} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Issue PDF</label>
          <input type="file" className="form-control" accept=".pdf" onChange={(e) => setPdf(e.target.files?.[0] || null)} />
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label">Soft Copy Rate</label>
          <input type="number" className="form-control" value={softCopyRate} onChange={(e) => setSoftCopyRate(e.target.value)} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Hard Copy Rate</label>
          <input type="number" className="form-control" value={hardCopyRate} onChange={(e) => setHardCopyRate(e.target.value)} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Both Rate</label>
          <input type="number" className="form-control" value={bothRate} onChange={(e) => setBothRate(e.target.value)} />
        </div>
      </div>

      <div className="form-check mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          id="issue-coupon"
          checked={couponApplicable}
          onChange={(e) => setCouponApplicable(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="issue-coupon">
          Coupon applicable
        </label>
      </div>

      <div className="mb-3" style={{ maxWidth: 220 }}>
        <label className="form-label">Status</label>
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {existing && (
        <div className="form-check mb-3">
          <input type="checkbox" className="form-check-input" id="issue-active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <label className="form-check-label" htmlFor="issue-active">
            Active
          </label>
        </div>
      )}

      <button type="submit" className="btn custom-btn" disabled={busy}>
        {busy && <span className="btn-spinner"></span>}
        Save Issue
      </button>
    </form>
  );
}
