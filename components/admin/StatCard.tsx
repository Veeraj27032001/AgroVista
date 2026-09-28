export default function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">{label}</p>
      <p className="mt-2 font-serif text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
