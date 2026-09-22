'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

export default function FileUpload({
  label,
  accept,
  onChange,
  required
}: {
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setFileName(file?.name || null);
    onChange(file);
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-primary"
      >
        <Upload className="h-4 w-4" />
        {fileName || 'Choose a file'}
      </button>
      <input ref={inputRef} type="file" accept={accept} required={required} onChange={handleChange} className="hidden" />
    </div>
  );
}
