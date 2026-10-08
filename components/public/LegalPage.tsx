export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="section-padding" style={{ paddingTop: 150 }}>
      <div className="container" style={{ maxWidth: 820 }}>
        <h1 className="mb-1">{title}</h1>
        <p className="text-muted small mb-4">Last updated: {updated}</p>
        <div className="legal-content">{children}</div>
      </div>
    </div>
  );
}
