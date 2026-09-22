import type { Format } from '@/lib/types';

export type FormatOption = { format: Format; label: string; price: number | null };

export default function FormatSelector({
  options,
  value,
  onChange
}: {
  options: FormatOption[];
  value: Format;
  onChange: (format: Format) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const disabled = opt.price === null;
        const selected = value === opt.format && !disabled;
        return (
          <button
            key={opt.format}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.format)}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
              disabled
                ? 'cursor-not-allowed border-gray-200 text-gray-300'
                : selected
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-gray-300 hover:border-primary'
            }`}
          >
            <div className="font-semibold">{opt.label}</div>
            <div>{opt.price === null ? 'Not available' : `₹${opt.price}`}</div>
          </button>
        );
      })}
    </div>
  );
}
