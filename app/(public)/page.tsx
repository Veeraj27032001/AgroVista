import { listPublishedIssues } from '@/lib/db/catalog';
import { getSession } from '@/lib/auth';
import { hasPdfAccess } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function lowestPrice(issue: { softCopyRate: number | null; hardCopyRate: number | null; bothRate: number | null }): number | null {
  const prices = [issue.softCopyRate, issue.hardCopyRate, issue.bothRate].filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

export default async function HomePage() {
  const { issues } = await listPublishedIssues({ page: 1, pageSize: 4 });
  const latest = issues[0];
  const recent = issues.slice(1, 4);

  const session = await getSession();
  const latestAccess = latest && session ? await hasPdfAccess(session.userId, latest) : false;

  return (
    <>
      <section className="hero-section">
        <div className="container position-relative">
          <div className="row align-items-center">
            <div className="col-lg-6 col-12 mb-5 mb-lg-0">
              <span className="hero-badge">
                <i className="bi bi-calendar-event"></i> New issue every month
              </span>
              <h1 className="mb-4">Stories &amp; data shaping the future of agriculture.</h1>
              <p className="lead mb-4">
                AgroVista Monthly brings farmers, agronomists and agribusiness leaders in-depth reporting on
                technology, markets, sustainability and the people growing the world&apos;s food. Sign in and unlock
                any issue to read online.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <a href="#latest-issue" className="btn custom-btn">
                  Read Current Issue
                </a>
                <a href="/archive" className="btn custom-btn custom-btn-outline-light">
                  Browse Archive
                </a>
              </div>

              <div className="hero-stats">
                <div>
                  <span className="stat-num">{issues.length || '—'}</span>
                  <span className="stat-label">Issues Published</span>
                </div>
                <div>
                  <span className="stat-num">3</span>
                  <span className="stat-label">Volumes</span>
                </div>
                <div>
                  <span className="stat-num">45K+</span>
                  <span className="stat-label">Monthly Readers</span>
                </div>
              </div>
            </div>

            <div className="col-lg-5 col-12 mx-auto">
              <div className="hero-cover-wrap">
                <span className="hero-cover-badge">Latest Issue</span>
                <div className="hero-cover-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={latest?.posterUrl || 'https://placehold.co/600x800/4C7A3F/ffffff?text=AgroVista'}
                    alt={latest ? `${latest.title} cover` : 'Latest issue cover'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="wave-divider">
          <svg viewBox="0 0 1440 110" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path
              fill="#ffffff"
              d="M0,64L60,58.7C120,53,240,43,360,48C480,53,600,75,720,80C840,85,960,75,1080,64C1200,53,1320,43,1380,37.3L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
            ></path>
          </svg>
        </div>
      </section>

      <div className="stats-strip">
        <div className="container">
          <div className="row text-center g-4">
            <div className="col-6 col-lg-3">
              <span className="stat-num">{issues.length || '—'}</span>
              <span className="stat-label">Monthly Issues</span>
            </div>
            <div className="col-6 col-lg-3">
              <span className="stat-num">120+</span>
              <span className="stat-label">Contributing Experts</span>
            </div>
            <div className="col-6 col-lg-3">
              <span className="stat-num">60+</span>
              <span className="stat-label">Countries Read In</span>
            </div>
            <div className="col-6 col-lg-3">
              <span className="stat-num">₹49</span>
              <span className="stat-label">Per Issue, Read Online</span>
            </div>
          </div>
        </div>
      </div>

      <section className="section-padding" id="latest-issue">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-5 col-12 mb-4 mb-lg-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={latest?.posterUrl || 'https://placehold.co/600x800/4C7A3F/ffffff?text=AgroVista'}
                className="img-fluid rounded-4 shadow"
                alt={latest ? latest.title : 'Latest issue cover'}
              />
            </div>
            <div className="col-lg-6 col-12 ms-lg-auto">
              <div className="eyebrow">Current Issue</div>
              {latest ? (
                <>
                  <h2 className="mb-3">{latest.title}</h2>
                  <p className="mb-2">
                    <strong>{formatDate(latest.publishedAt)}</strong> &nbsp;·&nbsp; {latest.language}
                  </p>
                  <p className="mb-3">{latest.description}</p>
                  <div className="mb-4">
                    {latestAccess ? (
                      <span className="badge-owned">
                        <i className="bi bi-check-circle-fill"></i> You own this issue
                      </span>
                    ) : (
                      <span className="badge-locked">
                        <i className="bi bi-lock-fill"></i>{' '}
                        {lowestPrice(latest) !== null ? `₹${lowestPrice(latest)} to unlock` : 'View details'}
                      </span>
                    )}
                  </div>
                  <div className="d-flex flex-wrap gap-3">
                    <a href={`/issues/${latest.id}`} className="btn custom-btn">
                      {latestAccess ? 'Continue Reading' : 'Unlock & Read'}
                    </a>
                    <a href={`/issues/${latest.id}`} className="btn custom-btn custom-btn-secondary">
                      Issue Details
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mb-3">No issues published yet</h2>
                  <p className="mb-3">Check back soon — new issues are added regularly.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding section-bg" id="about">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-12 mb-5 mb-lg-0">
              <div className="eyebrow">About the Magazine</div>
              <h2 className="mb-4">Independent, practical reporting for the whole agriculture value chain.</h2>
              <p>
                AgroVista Monthly has published issues since 2024 — covering crop science, livestock, agri-tech,
                policy and the markets that move the industry. Every issue is written for people who work the land
                and the businesses that support them.
              </p>
              <p className="mb-0">
                Sign in once, unlock an issue for a small one-time fee, and read it online any time afterwards — no
                re-purchase needed, ever.
              </p>
            </div>
            <div className="col-lg-5 col-12 ms-lg-auto">
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <div>
                  <h5>Markets &amp; Policy</h5>
                  <p>Grain prices, trade rules and subsidy shifts explained in plain language.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="bi bi-cpu"></i>
                </div>
                <div>
                  <h5>Agri-Technology</h5>
                  <p>Drones, sensors, precision farming and the startups building what&apos;s next.</p>
                </div>
              </div>
              <div className="feature-item mb-0">
                <div className="feature-icon">
                  <i className="bi bi-shield-lock"></i>
                </div>
                <div>
                  <h5>Read Online, Securely</h5>
                  <p>Every issue opens after sign-in — access follows your account, not a device.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding" id="categories">
        <div className="container">
          <div className="row mb-5">
            <div className="col-lg-7 mx-auto text-center">
              <div className="eyebrow justify-content-center">What We Cover</div>
              <h2>Every issue, organized by the topics that matter to you</h2>
            </div>
          </div>
          <div className="row g-3 justify-content-center">
            {[
              ['English', 'bi-globe'],
              ['Hindi', 'bi-translate'],
              ['Kannada', 'bi-translate'],
              ['Tamil', 'bi-translate'],
              ['Telugu', 'bi-translate']
            ].map(([label, icon]) => (
              <div className="col-auto" key={label}>
                <a href={`/archive?language=${encodeURIComponent(label)}`} className="category-pill">
                  <i className={`bi ${icon}`}></i> {label}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding section-bg">
        <div className="container">
          <div className="row align-items-end mb-5">
            <div className="col-lg-7">
              <div className="eyebrow">Recent Issues</div>
              <h2 className="mb-0">Catch up on the last few months</h2>
            </div>
            <div className="col-lg-5 text-lg-end mt-3 mt-lg-0">
              <a href="/archive" className="link-arrow">
                Browse the full archive <i className="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>
          <div className="row g-4">
            {recent.length === 0 ? (
              <div className="col-12 text-center text-muted py-5">No other issues yet.</div>
            ) : (
              recent.map((issue) => (
                <div className="col-lg-4 col-md-6 col-12" key={issue.id}>
                  <div className="issue-card">
                    <div className="issue-card-cover">
                      <span className="issue-card-tag">{issue.language}</span>
                      <a href={`/issues/${issue.id}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={issue.posterUrl || 'https://placehold.co/600x800/4C7A3F/ffffff?text=AgroVista'} alt={issue.title} />
                      </a>
                    </div>
                    <div className="issue-card-body">
                      <div className="issue-card-meta">{formatDate(issue.publishedAt)}</div>
                      <h3 className="issue-card-title">
                        <a href={`/issues/${issue.id}`}>{issue.title}</a>
                      </h3>
                      <p className="mb-3 small">{issue.description}</p>
                      <a href={`/issues/${issue.id}`} className="btn custom-btn custom-btn-sm">
                        <i className="bi bi-unlock me-1"></i>
                        {lowestPrice(issue) !== null ? `Unlock & Read — ₹${lowestPrice(issue)}` : 'View Issue'}
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="section-padding" id="contact">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-12 mb-5 mb-lg-0">
              <div className="eyebrow">Get in Touch</div>
              <h2 className="mb-4">Story ideas, feedback or advertising enquiries</h2>
              <form action="#" method="post" className="row g-3">
                <div className="col-md-6">
                  <label className="form-label mb-2">Full Name</label>
                  <input type="text" className="form-control" placeholder="Your name" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label mb-2">Email address</label>
                  <input type="email" className="form-control" placeholder="you@example.com" required />
                </div>
                <div className="col-12">
                  <label className="form-label mb-2">Message</label>
                  <textarea className="form-control" rows={4} placeholder="Tell us what you'd like to see covered"></textarea>
                </div>
                <div className="col-12">
                  <button type="submit" className="btn custom-btn">
                    Send Message
                  </button>
                </div>
              </form>
            </div>
            <div className="col-lg-5 col-12 ms-lg-auto">
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="bi bi-envelope"></i>
                </div>
                <div>
                  <h5>Editorial Desk</h5>
                  <p>
                    <a href="mailto:editor@agrovistamonthly.com" className="text-primary-custom">
                      editor@agrovistamonthly.com
                    </a>
                  </p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="bi bi-telephone"></i>
                </div>
                <div>
                  <h5>Reader Support</h5>
                  <p>+91 80 4567 8900 &nbsp;·&nbsp; Mon–Fri, 9am–6pm IST</p>
                </div>
              </div>
              <div className="feature-item mb-0">
                <div className="feature-icon">
                  <i className="bi bi-geo-alt"></i>
                </div>
                <div>
                  <h5>Head Office</h5>
                  <p className="mb-0">Bengaluru, Karnataka, India</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
