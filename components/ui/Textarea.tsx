import { TextareaHTMLAttributes, forwardRef } from 'react';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string };

const Textarea = forwardRef<HTMLTextAreaElement, Props>(({ label, error, className = '', id, rows = 4, ...rest }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          error ? 'border-red-400' : 'border-gray-300'
        } ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});
Textarea.displayName = 'Textarea';

export default Textarea;
