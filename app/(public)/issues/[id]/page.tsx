'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Format, Issue } from '@/lib/types';
import { getSession } from '@/lib/client/session';
import { addToCart } from '@/lib/client/cart';
import { runRazorpayCheckout } from '@/lib/client/checkout';
import FormatSelector, { type FormatOption } from '@/components/public/FormatSelector';
import CouponInput, { type AppliedCoupon } from '@/components/public/CouponInput';

function lowestPrice(issue: Issue): number | null {
  const prices = [issue.softCopyRate, issue.hardCopyRate, issue.bothRate].filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

/**
 * Only offers what's still missing — a reader who already has the digital
 * copy can still buy just the hard copy (and vice versa); "Both" only makes
 * sense when they have neither yet, since it would otherwise double-charge
 * for the half they've already paid for.
 */
function buildFormatOptions(issue: Issue, hasDigital: boolean, hasHard: boolean, hardCopyAvailable: boolean): FormatOption[] {
  const options: FormatOption[] = [];
  if (!hasDigital && issue.softCopyRate !== null) {
    options.push({ format: 'soft', label: 'Soft Copy', price: issue.softCopyRate });
  }
  if (!hasHard && issue.hardCopyRate !== null) {
    options.push({ format: 'hard', label: 'Hard Copy', price: issue.hardCopyRate, outOfStock: !hardCopyAvailable });
  }
  if (!hasDigital && !hasHard && issue.bothRate !== null) {
    options.push({ format: 'both', label: 'Both', price: issue.bothRate, outOfStock: !hardCopyAvailable });
  }
  return options;
}

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [hasHardCopy, setHasHardCopy] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [format, setFormat] = useState<Format>('soft');
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [related, setRelated] = useState<Issue[]>([]);

  useEffect(() => {
    fetch(`/api/issues/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setIssue(data.issue);
        setHasAccess(data.hasAccess);
        setHasHardCopy(data.hasHardCopy);
        const stockOk = data.issue.printStockTotal === 0 || data.issue.printStockTotal - data.issue.printStockReservedSubs - data.issue.printStockSold > 0;
        const avail = buildFormatOptions(data.issue, data.hasAccess, data.hasHardCopy, stockOk);
        if (avail.length > 0) setFormat(avail[0].format);

        fetch(`/api/issues?pageSize=5`)
          .then((r) => r.json())
          .then((d) => setRelated((d.issues || []).filter((i: Issue) => i.id !== data.issue.id).slice(0, 4)));
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="section-padding" style={{ paddingTop: 170 }}>
        <div className="container text-center">
          <i className="bi bi-journal-x" style={{ fontSize: 48, color: 'var(--border-color)' }}></i>
          <h2 className="mt-3">Article not found</h2>
          <p>The article you&apos;re looking for doesn&apos;t exist or the link is incorrect.</p>
          <a href="/archive" className="btn custom-btn">
            Go to Archive
          </a>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="section-padding text-center" style={{ paddingTop: 170 }}>
        <i className="bi bi-arrow-repeat" style={{ fontSize: 32 }}></i>
      </div>
    );
  }

  const hardCopyAvailable = issue.printStockTotal === 0 || issue.printStockTotal - issue.printStockReservedSubs - issue.printStockSold > 0;
  const options = buildFormatOptions(issue, hasAccess, hasHardCopy, hardCopyAvailable);
  const rateField = format === 'soft' ? issue.softCopyRate : format === 'hard' ? issue.hardCopyRate : issue.bothRate;
  const price = coupon ? coupon.finalPrice : rateField;
  const formatOutOfStock = (format === 'hard' || format === 'both') && !hardCopyAvailable;

  async function handleAddToCart() {
    const session = await getSession();
    if (!session.authenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }
    addToCart(issue!.id, format);
    toast.success('Added to cart');
  }

  async function handleBuyNow() {
    const session = await getSession();
    if (!session.authenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'issue', itemId: issue!.id, format, couponCode: coupon?.code })
      });
      const order = await res.json();
      if (!res.ok) {
        if (order.error === 'incomplete_profile') {
          toast.error(order.message);
          window.location.href = `/account/edit?incomplete=1&redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        toast.error(order.message || 'Could not start checkout.');
        setBusy(false);
        return;
      }
      await runRazorpayCheckout({
        order,
        type: 'issue',
        description: issue!.title,
        prefillEmail: session.user!.email,
        onSuccess: () => {
          toast.success('Purchase complete!');
          window.location.reload();
        },
        onDismiss: () => setBusy(false)
      });
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.');
      setBusy(false);
    }
  }

  async function handleOpenViewer() {
    setOpening(true);
    try {
      const res = await fetch(`/api/download/${issue!.id}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Could not open the article.');
        return;
      }
      setViewerUrl(data.url);
    } finally {
      setOpening(false);
    }
  }

  const price0 = lowestPrice(issue);

  return (
    <div>
      <section className="issue-hero">
        <div className="container">
          <div className="breadcrumb-trail">
            <a href="/">Home</a> / <a href="/archive">Archive</a> / <span>{issue.title}</span>
          </div>
          <div className="row align-items-center">
            <div className="col-lg-4 col-8 mx-auto mx-lg-0 mb-4 mb-lg-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={issue.posterUrl || 'https://placehold.co/600x800/4C7A3F/ffffff?text=AgriOxen'}
                alt={issue.title}
                className="issue-hero-cover"
              />
            </div>
            <div className="col-lg-8 col-12 ms-lg-4">
              <div className="issue-card-meta mb-2">{issue.language}</div>
              <h1 className="mb-3">{issue.title}</h1>
              <p className="mb-3">{issue.description}</p>
              <div className="mb-3 d-flex flex-wrap gap-2">
                {hasAccess && (
                  <span className="badge-owned">
                    <i className="bi bi-check-circle-fill"></i> You own the digital copy
                  </span>
                )}
                {hasHardCopy && (
                  <span className="badge-owned">
                    <i className="bi bi-check-circle-fill"></i> Hard copy ordered
                  </span>
                )}
                {!hasAccess && !hasHardCopy && (
                  <span className="badge-locked">
                    <i className="bi bi-lock-fill"></i> {price0 !== null ? `₹${price0} to unlock` : 'View details'}
                  </span>
                )}
              </div>

              {hasAccess && (
                <div className="d-flex flex-wrap gap-3 mb-4">
                  <button type="button" className="btn custom-btn" onClick={handleOpenViewer} disabled={opening}>
                    {opening ? <span className="btn-spinner"></span> : <i className="bi bi-eye me-1"></i>}
                    {opening ? 'Preparing…' : 'Read Now'}
                  </button>
                </div>
              )}

              {options.length > 0 && (
                <div className="mb-4">
                  {hasAccess && <p className="small text-muted mb-2">Also want a hard copy delivered?</p>}
                  {!hasAccess && hasHardCopy && <p className="small text-muted mb-2">You already have the hard copy — add digital access to read it online:</p>}
                  <FormatSelector options={options} value={format} onChange={setFormat} />
                  {issue.couponApplicable && (
                    <div className="mt-3">
                      <CouponInput itemType="issue" itemId={issue.id} format={format} onApplied={setCoupon} />
                    </div>
                  )}
                  <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
                    <button type="button" className="btn custom-btn" onClick={handleBuyNow} disabled={busy || price === null || formatOutOfStock}>
                      {busy ? <span className="btn-spinner"></span> : <i className="bi bi-unlock me-1"></i>}
                      {busy ? 'Starting…' : `Buy Now — ${price !== null ? `₹${price}` : ''}`}
                    </button>
                    <button
                      type="button"
                      className="btn custom-btn custom-btn-secondary"
                      onClick={handleAddToCart}
                      disabled={price === null || formatOutOfStock}
                    >
                      <i className="bi bi-cart me-1"></i> Add to Cart
                    </button>
                  </div>
                  {formatOutOfStock && <p className="small text-danger mt-2 mb-0">Hard copy stock for this article is sold out.</p>}
                </div>
              )}
              {options.length > 0 && (
                <p className="small text-muted mt-3 mb-0">
                  <i className="bi bi-shield-lock me-1"></i>Sign in to unlock this article and read it online.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {viewerUrl && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
          style={{ zIndex: 2000, background: 'rgba(0,0,0,0.85)' }}
        >
          <div className="d-flex justify-content-between align-items-center p-3">
            <span className="text-white small">{issue.title}</span>
            <button type="button" className="btn custom-btn custom-btn-secondary custom-btn-sm" onClick={() => setViewerUrl(null)}>
              <i className="bi bi-x-lg me-1"></i>Close
            </button>
          </div>
          <iframe src={viewerUrl} title={issue.title} className="flex-grow-1 w-100 border-0" />
        </div>
      )}

      {related.length > 0 && (
        <section className="section-padding section-bg">
          <div className="container">
            <div className="eyebrow">Keep Reading</div>
            <h2 className="mb-4">More articles</h2>
            <div className="row g-4">
              {related.map((rel) => (
                <div className="col-lg-3 col-md-6 col-12" key={rel.id}>
                  <div className="issue-card">
                    <div className="issue-card-cover">
                      <span className="issue-card-tag">{rel.language}</span>
                      <a href={`/issues/${rel.id}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={rel.posterUrl || 'https://placehold.co/600x800/4C7A3F/ffffff?text=AgriOxen'} alt={rel.title} />
                      </a>
                    </div>
                    <div className="issue-card-body">
                      <h3 className="issue-card-title" style={{ fontSize: 16 }}>
                        <a href={`/issues/${rel.id}`}>{rel.title}</a>
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
