'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Lock, ShoppingCart } from 'lucide-react';
import type { Format, Issue } from '@/lib/types';
import { getSession } from '@/lib/client/session';
import { addToCart } from '@/lib/client/cart';
import { runRazorpayCheckout } from '@/lib/client/checkout';
import FormatSelector, { type FormatOption } from '@/components/public/FormatSelector';
import CouponInput, { type AppliedCoupon } from '@/components/public/CouponInput';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [format, setFormat] = useState<Format>('soft');
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

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
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Issue not found</h1>
        <p className="mt-2 text-gray-500">This issue doesn&apos;t exist or isn&apos;t published yet.</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
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

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-2">
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={issue.posterUrl || undefined} alt={issue.title} className="aspect-[3/4] w-full object-cover" />
      </div>

      <div>
        <span className="text-xs font-semibold uppercase text-primary">{issue.language}</span>
        <h1 className="mt-1 font-serif text-3xl font-bold">{issue.title}</h1>
        {issue.description && <p className="mt-3 text-gray-600">{issue.description}</p>}

        {hasAccess ? (
          <div className="mt-6">
            <Button onClick={handleDownload} loading={downloading}>
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <FormatSelector options={options} value={format} onChange={setFormat} />
            {issue.couponApplicable && (
              <CouponInput itemType="issue" itemId={issue.id} format={format} onApplied={setCoupon} />
            )}
            <p className="text-2xl font-bold">{price !== null ? `₹${price}` : 'Not available'}</p>
            <div className="flex gap-3">
              <Button onClick={handleBuyNow} loading={busy} disabled={price === null}>
                <Lock className="h-4 w-4" /> Buy Now
              </Button>
              <Button variant="secondary" onClick={handleAddToCart} disabled={price === null}>
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
