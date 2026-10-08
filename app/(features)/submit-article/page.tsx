'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import FileUpload from '@/components/ui/FileUpload';
import Button from '@/components/ui/Button';
import { ARTICLE_THEMES } from '@/lib/types';

const SALUTATIONS = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Other'];
const MAX_WORDS = 2000;

type PersonDetails = {
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  affiliation: string;
  designation: string;
  city: string;
  state: string;
  country: string;
};

const emptyPerson = (): PersonDetails => ({
  salutation: 'Mr.',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  affiliation: '',
  designation: '',
  city: '',
  state: '',
  country: 'India'
});

function PersonFields({ person, onChange }: { person: PersonDetails; onChange: (p: PersonDetails) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Select
        label="Salutation"
        value={person.salutation}
        onChange={(e) => onChange({ ...person, salutation: e.target.value })}
        options={SALUTATIONS.map((s) => ({ value: s, label: s }))}
      />
      <div />
      <Input label="First Name" required value={person.firstName} onChange={(e) => onChange({ ...person, firstName: e.target.value })} />
      <Input label="Last Name" required value={person.lastName} onChange={(e) => onChange({ ...person, lastName: e.target.value })} />
      <Input label="Email ID" type="email" required value={person.email} onChange={(e) => onChange({ ...person, email: e.target.value })} />
      <Input label="Contact Number" value={person.phone} onChange={(e) => onChange({ ...person, phone: e.target.value })} />
      <Input label="Affiliation / Organization" value={person.affiliation} onChange={(e) => onChange({ ...person, affiliation: e.target.value })} />
      <Input label="Designation" value={person.designation} onChange={(e) => onChange({ ...person, designation: e.target.value })} />
      <Input label="City" value={person.city} onChange={(e) => onChange({ ...person, city: e.target.value })} />
      <Input label="State" value={person.state} onChange={(e) => onChange({ ...person, state: e.target.value })} />
      <Input label="Country" value={person.country} onChange={(e) => onChange({ ...person, country: e.target.value })} />
    </div>
  );
}

export default function SubmitArticlePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState<string>(ARTICLE_THEMES[0]);
  const [themeOther, setThemeOther] = useState('');
  const [word, setWord] = useState<File | null>(null);
  const [wordCountWarning, setWordCountWarning] = useState('');
  const [primaryAuthor, setPrimaryAuthor] = useState<PersonDetails>(emptyPerson());
  const [coAuthors, setCoAuthors] = useState<PersonDetails[]>([]);
  const [declaration, setDeclaration] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ articleCode: string } | null>(null);

  function addCoAuthor() {
    setCoAuthors([...coAuthors, emptyPerson()]);
  }
  function updateCoAuthor(i: number, p: PersonDetails) {
    setCoAuthors(coAuthors.map((c, idx) => (idx === i ? p : c)));
  }
  function removeCoAuthor(i: number) {
    setCoAuthors(coAuthors.filter((_, idx) => idx !== i));
  }

  async function handleWordFile(file: File | null) {
    setWord(file);
    setWordCountWarning('');
    if (file && /\.docx$/i.test(file.name)) {
      try {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(file);
        const doc = await zip.file('word/document.xml')?.async('text');
        if (doc) {
          const text = doc.replace(/<[^>]+>/g, ' ');
          const words = text.trim().split(/\s+/).filter(Boolean).length;
          if (words > MAX_WORDS) {
            setWordCountWarning(`This file is approximately ${words} words, over the ${MAX_WORDS}-word / 5–6 page limit.`);
          }
        }
      } catch {
        // best-effort client-side estimate only — not a hard requirement
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!word) {
      toast.error('Please attach your manuscript (.doc or .docx).');
      return;
    }
    if (!declaration) {
      toast.error('Please accept the declaration before submitting.');
      return;
    }
    setBusy(true);
    const form = new FormData();
    form.set('title', title);
    form.set('description', description);
    form.set('language', language);
    form.set('theme', theme);
    form.set('themeOther', themeOther);
    form.set('declaration', 'true');
    form.set('authorDetails', JSON.stringify(primaryAuthor));
    form.set('coAuthors', JSON.stringify(coAuthors));
    form.set('word', word);

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
    setDone({ articleCode: data.submission.articleCode });
    setBusy(false);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-24 pt-[150px] text-center">
        <h1 className="text-2xl font-bold">Thanks for your submission!</h1>
        <p className="mt-3 text-gray-600">
          Your Article ID is <span className="font-mono font-semibold text-primary">{done.articleCode}</span>. A confirmation email has
          been sent — track your submission anytime from{' '}
          <a href="/account/submissions" className="text-primary underline">
            My Submissions
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-[150px]">
      <h1 className="mb-6 text-3xl font-bold">Submit an Article</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Article Information</h2>
          <Select
            label="Article Theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            options={ARTICLE_THEMES.map((t) => ({ value: t, label: t }))}
          />
          {theme === 'Other' && <Input label="Specify Theme" value={themeOther} onChange={(e) => setThemeOther(e.target.value)} />}
          <Input label="Article Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Select
            label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu'].map((l) => ({ value: l, label: l }))}
          />
          <div>
            <FileUpload label="Article File (.doc/.docx only, max 2,000 words / 5–6 pages)" accept=".doc,.docx" required onChange={handleWordFile} />
            {wordCountWarning && <p className="mt-1 text-sm text-amber-600">{wordCountWarning}</p>}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold">Primary Author Details</h2>
          <PersonFields person={primaryAuthor} onChange={setPrimaryAuthor} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Co-Authors</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addCoAuthor}>
              + Add Co-Author
            </Button>
          </div>
          {coAuthors.map((c, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Co-Author {i + 1}</h3>
                <button type="button" className="text-sm text-red-600" onClick={() => removeCoAuthor(i)}>
                  Remove
                </button>
              </div>
              <PersonFields person={c} onChange={(p) => updateCoAuthor(i, p)} />
            </div>
          ))}
        </section>

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" className="mt-1 accent-primary" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} />
          <span>
            I confirm the submitted information is correct, the article is original, and I agree to AgriOxen&apos;s submission and
            publication guidelines.
          </span>
        </label>

        <Button type="submit" className="w-full" loading={busy} disabled={!declaration}>
          Submit Article
        </Button>
      </form>
    </div>
  );
}
