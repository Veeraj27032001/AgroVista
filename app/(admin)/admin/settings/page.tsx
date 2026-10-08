'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SETTINGS_FIELDS } from '@/lib/settings-fields';

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const merged: Record<string, string> = {};
        for (const f of SETTINGS_FIELDS) {
          const raw = data.settings?.[f.key];
          merged[f.key] = f.type === 'json' ? JSON.stringify(raw ?? (f.key === 'article_reminder_days_before' ? [] : {}), null, 2) : String(raw ?? '');
        }
        setValues(merged);
      });
  }, []);

  async function save(key: string, type: 'number' | 'json') {
    if (!values) return;
    let value: unknown = values[key];
    try {
      value = type === 'number' ? Number(values[key]) : JSON.parse(values[key]);
    } catch {
      toast.error('Invalid JSON.');
      return;
    }
    setBusy(key);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    setBusy(null);
    if (!res.ok) {
      toast.error('Could not save setting.');
      return;
    }
    toast.success('Saved');
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
        Settings
      </h1>
      <div className="admin-card">
        {SETTINGS_FIELDS.map((f) => (
          <div className="row align-items-start mb-3 pb-3 border-bottom" key={f.key}>
            <div className="col-md-5">
              <label className="form-label mb-0">{f.label}</label>
              {f.help && <div className="text-muted small">{f.help}</div>}
            </div>
            <div className="col-md-5">
              {f.type === 'json' ? (
                <textarea
                  className="form-control font-monospace small"
                  rows={3}
                  value={values[f.key]}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              ) : (
                <input
                  type="number"
                  className="form-control"
                  value={values[f.key]}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              )}
            </div>
            <div className="col-md-2">
              <button type="button" className="btn custom-btn custom-btn-sm" disabled={busy === f.key} onClick={() => save(f.key, f.type)}>
                {busy === f.key && <span className="btn-spinner"></span>}
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
