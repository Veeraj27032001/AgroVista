export default function Badge({ label, statusKey }: { label: string; statusKey?: string }) {
  const key = statusKey || label.toLowerCase().replace(/\s+/g, '_');
  return <span className={`status-${key} inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize`}>{label.replace(/_/g, ' ')}</span>;
}
