'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Issue } from '@/lib/types';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import FileUpload from '../ui/FileUpload';
import Button from '../ui/Button';

export default function IssueForm({
  slotId,
  volumeId,
  isSpecialEdition,
  existing,
  onSaved
}: {
  slotId?: string;
  volumeId?: string;
  isSpecialEdition?: boolean;
  existing?: Issue;
  onSaved: (issue: Issue) => void;
}) {
  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [language, setLanguage] = useState(existing?.language || 'English');
  const [softCopyRate, setSoftCopyRate] = useState(existing?.softCopyRate?.toString() || '');
  const [hardCopyRate, setHardCopyRate] = useState(existing?.hardCopyRate?.toString() || '');
  const [bothRate, setBothRate] = useState(existing?.bothRate?.toString() || '');
  const [couponApplicable, setCouponApplicable] = useState(existing?.couponApplicable ?? true);
  const [status, setStatus] = useState(existing?.status || 'draft');
  const [poster, setPoster] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    const form = new FormData();
    form.set('title', title);
    form.set('description', description);
    form.set('language', language);
    if (softCopyRate) form.set('softCopyRate', softCopyRate);
    if (hardCopyRate) form.set('hardCopyRate', hardCopyRate);
    if (bothRate) form.set('bothRate', bothRate);
    form.set('couponApplicable', String(couponApplicable));
    form.set('status', status);
    if (poster) form.set('poster', poster);
    if (pdf) form.set('pdf', pdf);

    let res: Response;
    if (existing) {
      res = await fetch(`/api/admin/${isSpecialEdition ? 'special-editions' : 'issues'}/${existing.id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: isSpecialEdition ? JSON.stringify(Object.fromEntries(form)) : form,
        headers: isSpecialEdition ? { 'Content-Type': 'application/json' } : undefined
      });
    } else {
      if (isSpecialEdition && volumeId) form.set('volumeId', volumeId);
      if (isSpecialEdition) form.set('isSpecialEdition', 'true');
      if (slotId) form.set('slotId', slotId);
      res = await fetch(`/api/admin/${isSpecialEdition ? 'special-editions' : 'issues'}`, {
        method: 'POST',
        credentials: 'include',
        body: form
      });
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
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4">
      <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Select
        label="Language"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        options={['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu'].map((l) => ({ value: l, label: l }))}
      />
      <FileUpload label="Poster Image" accept="image/*" onChange={setPoster} />
      <FileUpload label="Issue PDF" accept=".pdf" onChange={setPdf} />
      <div className="grid grid-cols-3 gap-3">
        <Input label="Soft Copy Rate" type="number" value={softCopyRate} onChange={(e) => setSoftCopyRate(e.target.value)} />
        <Input label="Hard Copy Rate" type="number" value={hardCopyRate} onChange={(e) => setHardCopyRate(e.target.value)} />
        <Input label="Both Rate" type="number" value={bothRate} onChange={(e) => setBothRate(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={couponApplicable} onChange={(e) => setCouponApplicable(e.target.checked)} className="accent-primary" />
        Coupon applicable
      </label>
      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
        options={[
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' }
        ]}
      />
      <Button type="submit" loading={busy} className="w-fit">
        Save Issue
      </Button>
    </form>
  );
}
