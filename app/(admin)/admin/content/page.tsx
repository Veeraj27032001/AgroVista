'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SITE_CONTENT_FIELDS } from '@/lib/site-content-fields';

export default function AdminContentPage() {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/content', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const merged: Record<string, string> = {};
        for (const f of SITE_CONTENT_FIELDS) merged[f.key] = data.content?.[f.key] ?? f.default;
        setValues(merged);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!values) return;
    setBusy(true);
    const res = await fetch('/api/admin/content', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: values })
    });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not save content.');
      return;
    }
    toast.success('Home page content updated');
  }

  if (!values) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: 24 }}>
        Home Page Content
      </h1>
      <form onSubmit={handleSave} className="admin-card">
        {SITE_CONTENT_FIELDS.map((f) => (
          <div className="mb-3" key={f.key}>
            <label className="form-label">{f.label}</label>
            {f.multiline ? (
              <textarea
                className="form-control"
                rows={3}
                value={values[f.key]}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            ) : (
              <input
                className="form-control"
                value={values[f.key]}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            )}
          </div>
        ))}
        <button type="submit" className="btn custom-btn" disabled={busy}>
          {busy && <span className="btn-spinner"></span>}
          Save Changes
        </button>
      </form>
    </div>
  );
}
