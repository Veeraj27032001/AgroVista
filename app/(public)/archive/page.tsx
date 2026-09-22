import ArchiveClient from '@/components/public/ArchiveClient';

export const metadata = { title: 'Magazine Archive — AgroVista Monthly' };

export default function ArchivePage() {
  return (
    <>
      <section className="archive-hero">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <div className="eyebrow" style={{ color: '#E3A93A' }}>
                Magazine Archive
              </div>
              <h1 className="mb-3">Every issue, easy to find</h1>
              <p className="mb-0">
                Search by title, or filter by year and language. Sign in once and unlock any issue — read online,
                forever accessible from your account.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ArchiveClient />
    </>
  );
}
