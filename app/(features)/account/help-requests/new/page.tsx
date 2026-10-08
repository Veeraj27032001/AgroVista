'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import FileUpload from '@/components/ui/FileUpload';
import Button from '@/components/ui/Button';

const TYPES = [
  { value: 'damaged', label: 'Damaged copy' },
  { value: 'wrong_issue', label: 'Wrong issue received' },
  { value: 'missing_pages', label: 'Missing pages' },
  { value: 'not_received', label: 'Not received' },
  { value: 'digital_access', label: 'Digital access problem' },
  { value: 'duplicate_purchase', label: 'Duplicate purchase' },
  { value: 'subscription_query', label: 'Subscription query' },
  { value: 'other', label: 'Other' }
];
const PHOTO_REQUIRED = ['damaged', 'wrong_issue', 'missing_pages'];

function NewHelpRequestInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const [type, setType] = useState('damaged');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 20) {
      toast.error('Please describe the issue in at least 20 characters.');
      return;
    }
    if (PHOTO_REQUIRED.includes(type) && !photos.some(Boolean)) {
      toast.error('Please attach at least one photo for this type of issue.');
      return;
    }
    setBusy(true);
    const form = new FormData();
    form.set('type', type);
    form.set('description', description);
    if (orderId) form.set('legacyIssueOrderId', orderId);
    photos.forEach((p, i) => p && form.set(`photo${i}`, p));

    const res = await fetch('/api/support-requests', { method: 'POST', credentials: 'include', body: form });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.message || 'Could not submit your request.');
      return;
    }
    setDone(data.request.requestNumber);
  }

  if (done) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Request submitted</h1>
        <p className="mt-2 text-gray-600">
          Your request number is <span className="font-mono font-semibold text-primary">{done}</span>. We&apos;ll follow up by email and
          on the request page.
        </p>
        <a href="/account/help-requests" className="mt-4 inline-block text-primary underline">
          View my help requests
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Report a Problem</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <Select label="Issue Type" value={type} onChange={(e) => setType(e.target.value)} options={TYPES} />
        <Textarea
          label="Describe the issue"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened? (20–2000 characters)"
        />
        {PHOTO_REQUIRED.includes(type) && (
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <FileUpload
                key={i}
                label={`Photo ${i + 1}${i === 0 ? ' (required)' : ' (optional)'}`}
                accept="image/*"
                onChange={(f) => setPhotos((prev) => prev.map((p, idx) => (idx === i ? f : p)))}
              />
            ))}
          </div>
        )}
        <Button type="submit" loading={busy} className="w-full">
          Submit Request
        </Button>
      </form>
    </div>
  );
}

export default function NewHelpRequestPage() {
  return (
    <Suspense>
      <NewHelpRequestInner />
    </Suspense>
  );
}
