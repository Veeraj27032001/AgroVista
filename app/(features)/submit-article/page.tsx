'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import FileUpload from '@/components/ui/FileUpload';
import Button from '@/components/ui/Button';

export default function SubmitArticlePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English');
  const [word, setWord] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!word || !pdf) {
      toast.error('Please attach both a Word file and a PDF file.');
      return;
    }
    setBusy(true);
    const form = new FormData();
    form.set('title', title);
    form.set('description', description);
    form.set('language', language);
    form.set('word', word);
    form.set('pdf', pdf);

    const res = await fetch('/api/submissions', { method: 'POST', credentials: 'include', body: form });
    if (res.status === 401) {
      window.location.href = `/login?redirect=${encodeURIComponent('/submit-article')}`;
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message || 'Could not submit your article.');
      setBusy(false);
      return;
    }
    setDone(true);
    setBusy(false);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Thanks for your submission!</h1>
        <p className="mt-2 text-gray-600">Our editorial team will review it and get back to you from your account&apos;s Submissions page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Submit an Article</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Select
          label="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          options={['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu'].map((l) => ({ value: l, label: l }))}
        />
        <FileUpload label="Word File" accept=".doc,.docx" required onChange={setWord} />
        <FileUpload label="PDF File" accept=".pdf" required onChange={setPdf} />
        <Button type="submit" className="w-full" loading={busy}>
          Submit Article
        </Button>
      </form>
    </div>
  );
}
