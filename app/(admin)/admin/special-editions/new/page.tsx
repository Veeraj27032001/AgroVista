'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import IssueForm from '@/components/admin/IssueForm';

export default function NewSpecialEditionPage() {
  const [volumeId, setVolumeId] = useState('');

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New Special Edition</h1>
      <div className="mb-4 max-w-2xl">
        <Input
          label="Volume ID"
          placeholder="Paste the volume's ID from its Years & Volumes page URL"
          value={volumeId}
          onChange={(e) => setVolumeId(e.target.value)}
        />
      </div>
      {volumeId && (
        <IssueForm volumeId={volumeId} isSpecialEdition onSaved={(issue) => (window.location.href = `/admin/special-editions`)} />
      )}
    </div>
  );
}
