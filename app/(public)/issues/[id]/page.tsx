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

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [format, setFormat] = useState<Format>('soft');
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [related, setRelated] = useState<Issue[]>([]);

  useEffect(() => {
    fetch(`/api/issues/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setIssue(data.issue);
        setHasAccess(data.hasAccess);
        const firstAvailable: Format | undefined = (['soft', 'hard', 'both'] as Format[]).find(
          (f) => data.issue[f === 'soft' ? 'softCopyRate' : f === 'hard' ? 'hardCopyRate' : 'bothRate'] !== null
        );
        if (firstAvailable) setFormat(firstAvailable);

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
          <h2 className="mt-3">Issue not found</h2>
          <p>The issue you&apos;re looking for doesn&apos;t exist or the link is incorrect.</p>
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

  const options: FormatOption[] = [
    { format: 'soft', label: 'Soft Copy', price: issue.softCopyRate },
    { format: 'hard', label: 'Hard Copy', price: issue.hardCopyRate },
    { format: 'both', label: 'Both', price: issue.bothRate }
  ];
  const rateField = format === 'soft' ? issue.softCopyRate : format === 'hard' ? issue.hardCopyRate : issue.bothRate;
  const price = coupon ? coupon.finalPrice : rateField;

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

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/download/${issue!.id}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Could not get download link.');
        return;
      }
      window.open(data.url, '_blank');
    } finally {
      setDownloading(false);
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
                src={issue.posterUrl || 'https://placehold.co/600x800/4C7A3F/ffffff?text=AgroVista'}
                alt={issue.title}
                className="issue-hero-cover"
              />
            </div>
            <div className="col-lg-8 col-12 ms-lg-4">
              <div className="issue-card-meta mb-2">{issue.language}</div>
              <h1 className="mb-3">{issue.title}</h1>
              <p className="mb-3">{issue.description}</p>
              <div className="mb-3">
                {hasAccess ? (
                  <span className="badge-owned">
                    <i className="bi bi-check-circle-fill"></i> You own this issue
                  </span>
                ) : (
                  <span className="badge-locked">
                    <i className="bi bi-lock-fill"></i> {price0 !== null ? `₹${price0} to unlock` : 'View details'}
                  </span>
                )}
              </div>

              {hasAccess ? (
                <div className="d-flex flex-wrap gap-3 mb-4">
                  <button type="button" className="btn custom-btn" onClick={handleDownload} disabled={downloading}>
                    {downloading ? <span className="btn-spinner"></span> : <i className="bi bi-download me-1"></i>}
                    {downloading ? 'Preparing…' : 'Download PDF'}
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <FormatSelector options={options} value={format} onChange={setFormat} />
                  {issue.couponApplicable && (
                    <div className="mt-3">
                      <CouponInput itemType="issue" itemId={issue.id} format={format} onApplied={setCoupon} />
                    </div>
                  )}
                  <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
                    <button type="button" className="btn custom-btn" onClick={handleBuyNow} disabled={busy || price === null}>
                      {busy ? <span className="btn-spinner"></span> : <i className="bi bi-unlock me-1"></i>}
                      {busy ? 'Starting…' : `Buy Now — ${price !== null ? `₹${price}` : ''}`}
                    </button>
                    <button
                      type="button"
                      className="btn custom-btn custom-btn-secondary"
                      onClick={handleAddToCart}
                      disabled={price === null}
                    >
                      <i className="bi bi-cart me-1"></i> Add to Cart
                    </button>
                  </div>
                </div>
              )}
              <p className="small text-muted mt-3 mb-0">
                <i className="bi bi-shield-lock me-1"></i>Sign in to unlock this issue and read it online.
              </p>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section-padding section-bg">
          <div className="container">
            <div className="eyebrow">Keep Reading</div>
            <h2 className="mb-4">More issues</h2>
            <div className="row g-4">
              {related.map((rel) => (
                <div className="col-lg-3 col-md-6 col-12" key={rel.id}>
                  <div className="issue-card">
                    <div className="issue-card-cover">
                      <span className="issue-card-tag">{rel.language}</span>
                      <a href={`/issues/${rel.id}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={rel.posterUrl || 'https://placehold.co/600x800/4C7A3F/ffffff?text=AgroVista'} alt={rel.title} />
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
