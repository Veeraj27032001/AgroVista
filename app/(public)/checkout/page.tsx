'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCart, removeFromCart } from '@/lib/client/cart';
import { getSession, type SessionResponse } from '@/lib/client/session';
import { runRazorpayCheckout } from '@/lib/client/checkout';
import CouponInput, { type AppliedCoupon } from '@/components/public/CouponInput';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

type CartLine = { issueId: string; title: string; posterUrl: string | null; format: string; price: number; couponApplicable: boolean };

export default function CheckoutPage() {
  const cart = useCart();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [payingIndex, setPayingIndex] = useState<number | null>(null);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      setLines([]);
      return;
    }
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart })
    })
      .then((r) => r.json())
      .then((data) => setLines(data.lines || []));
  }, [cart]);

  if (session && !session.authenticated) {
    window.location.href = `/login?redirect=${encodeURIComponent('/checkout')}`;
    return null;
  }

  async function payForLine(line: CartLine, index: number) {
    setPayingIndex(index);
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'issue',
          itemId: line.issueId,
          format: line.format,
          couponCode: index === 0 ? coupon?.code : undefined
        })
      });
      const order = await res.json();
      if (!res.ok) {
        toast.error(order.message || 'Could not start payment for this item.');
        setPayingIndex(null);
        return;
      }
      await runRazorpayCheckout({
        order,
        type: 'issue',
        description: line.title,
        prefillEmail: session!.user!.email,
        onSuccess: () => {
          toast.success(`Paid for ${line.title}`);
          removeFromCart(line.issueId);
          setPayingIndex(null);
        },
        onDismiss: () => setPayingIndex(null)
      });
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.');
      setPayingIndex(null);
    }
  }

  const subtotal = (lines || []).reduce((sum, l) => sum + l.price, 0);
  const total = coupon ? Math.max(0, subtotal - coupon.discountAmount) : subtotal;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

      {!lines ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : lines.length === 0 ? (
        <p className="text-gray-500">
          Your cart is empty.{' '}
          <Link href="/archive" className="font-semibold text-primary">
            Browse issues
          </Link>
        </p>
      ) : (
        <>
          {session?.user && (
            <div className="mb-6 rounded-xl border border-gray-200 p-4 text-sm">
              <p className="mb-1 font-semibold">Delivery address (for hard copy items)</p>
              <p className="text-gray-600">
                {session.user.address || 'No address on file'}
                {session.user.city ? `, ${session.user.city}` : ''} {session.user.pincode || ''}
              </p>
              <Link href="/account" className="mt-1 inline-block text-xs font-semibold text-primary">
                Update in your profile
              </Link>
            </div>
          )}

          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200">
            {lines.map((line, i) => (
              <div key={line.issueId} className="flex items-center gap-4 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={line.posterUrl || undefined} alt={line.title} className="h-16 w-12 rounded object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{line.title}</p>
                  <p className="text-xs capitalize text-gray-500">{line.format} copy</p>
                </div>
                <p className="text-sm font-semibold">₹{line.price}</p>
                <Button size="sm" loading={payingIndex === i} onClick={() => payForLine(line, i)}>
                  Pay
                </Button>
              </div>
            ))}
          </div>

          {lines[0]?.couponApplicable && (
            <div className="mt-4">
              <CouponInput itemType="issue" itemId={lines[0].issueId} format={lines[0].format as any} onApplied={setCoupon} />
              <p className="mt-1 text-xs text-gray-400">Coupon applies to the first item paid.</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">Each item is paid individually — click &quot;Pay&quot; per row to complete checkout.</p>
        </>
      )}
    </div>
  );
}
