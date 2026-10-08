'use client';

import { use, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

type ArticleInfo = {
  articleCode: string;
  title: string;
  status: string;
  publicationCharge: number;
  amountPaid: number;
  balance: number;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function ContributePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [article, setArticle] = useState<ArticleInfo | null | 'not_found'>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function load() {
    fetch(`/api/articles/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setArticle)
      .catch(() => setArticle('not_found'));
  }

  useEffect(load, [token]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!article || article === 'not_found') return;
    setBusy(true);
    const res = await fetch(`/api/articles/${token}/contribute/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, amount: Number(amount) })
    });
    const order = await res.json();
    if (!res.ok) {
      toast.error(order.message || 'Could not start payment.');
      setBusy(false);
      return;
    }

    if (typeof window.Razorpay === 'undefined') {
      toast.error('Payment library failed to load.');
      setBusy(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'AgriOxen',
      description: `Publication charge — ${article.articleCode}`,
      order_id: order.orderId,
      prefill: { email },
      theme: { color: '#4C7A3F' },
      handler: async (response: any) => {
        const verifyRes = await fetch(`/api/articles/${token}/contribute/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature
          })
        });
        setBusy(false);
        if (verifyRes.ok) {
          setDone(true);
        } else {
          toast.error('Payment could not be confirmed. If money was deducted, contact support.');
        }
      },
      modal: { ondismiss: () => setBusy(false) }
    });
    rzp.open();
  }

  if (article === null) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    );
  }

  if (article === 'not_found') {
    return <div className="mx-auto max-w-lg px-4 pb-24 pt-[150px] text-center text-gray-600">This payment link is invalid or has expired.</div>;
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-24 pt-[150px] text-center">
        <h1 className="text-2xl font-bold">Thank you!</h1>
        <p className="mt-2 text-gray-600">Your contribution has been recorded. A confirmation email will follow.</p>
      </div>
    );
  }

  if (article.balance <= 0) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-24 pt-[150px] text-center">
        <h1 className="text-2xl font-bold">Payment Complete</h1>
        <p className="mt-2 text-gray-600">The publication charge for this article has already been paid in full.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-[150px]">
      <h1 className="mb-1 text-2xl font-bold">Publication Charge</h1>
      <p className="mb-6 text-sm text-gray-500">
        {article.articleCode} — {article.title}
      </p>

      <div className="mb-6 grid grid-cols-3 gap-3 rounded-xl border border-gray-200 p-4 text-center">
        <div>
          <div className="text-xs uppercase text-gray-500">Total</div>
          <div className="font-semibold">₹{article.publicationCharge}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-500">Paid</div>
          <div className="font-semibold text-green-700">₹{article.amountPaid}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-500">Balance</div>
          <div className="font-semibold text-primary">₹{article.balance}</div>
        </div>
      </div>

      <form onSubmit={handlePay} className="space-y-4">
        <Input label="Your Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Your Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="Contribution Amount (₹)"
          type="number"
          required
          max={article.balance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button type="submit" className="w-full" loading={busy}>
          Pay ₹{amount || '0'}
        </Button>
      </form>
    </div>
  );
}
