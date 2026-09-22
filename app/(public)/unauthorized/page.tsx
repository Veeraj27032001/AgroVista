export const metadata = { title: 'Access Restricted — AgroVista Monthly' };

export default function UnauthorizedPage() {
  return (
    <div className="section-padding text-center" style={{ paddingTop: 170 }}>
      <div className="container">
        <i className="bi bi-shield-lock" style={{ fontSize: 48, color: 'var(--border-color)' }}></i>
        <h2 className="mt-3">Access Restricted</h2>
        <p>Your account doesn&apos;t have permission to view this page.</p>
        <a href="/" className="btn custom-btn">
          Back to Home
        </a>
      </div>
    </div>
  );
}
