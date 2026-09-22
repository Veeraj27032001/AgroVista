'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { SubscriptionPlan } from '@/lib/types';
import { getSession } from '@/lib/client/session';
import { runRazorpayCheckout, runRazorpayMandateCheckout } from '@/lib/client/checkout';
import PlanCard from '@/components/public/PlanCard';
import Spinner from '@/components/ui/Spinner';

export default function SubscribePage() {
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(true);

  useEffect(() => {
    fetch('/api/plans')
      .then((r) => r.json())
      .then((data) => setPlans(data.plans || []));
  }, []);

  async function handleSubscribe(plan: SubscriptionPlan) {
    const session = await getSession();
    if (!session.authenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }
    setBusyPlanId(plan.id);
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', itemId: plan.id, autoRenew })
      });
      const order = await res.json();
      if (!res.ok) {
        toast.error(order.message || 'Could not start checkout.');
        setBusyPlanId(null);
        return;
      }

      if (order.autoRenew) {
        await runRazorpayMandateCheckout({
          mandate: order,
          description: plan.name,
          prefillEmail: session.user!.email,
          onSuccess: () => {
            toast.success('Subscribed with autopay!');
            window.location.href = '/account/subscriptions';
          },
          onDismiss: () => setBusyPlanId(null)
        });
      } else {
        await runRazorpayCheckout({
          order,
          type: 'subscription',
          description: plan.name,
          prefillEmail: session.user!.email,
          onSuccess: () => {
            toast.success('Subscribed!');
            window.location.href = '/account/subscriptions';
          },
          onDismiss: () => setBusyPlanId(null)
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.');
      setBusyPlanId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Subscription Plans</h1>
      <p className="mb-4 text-gray-600">Choose soft copy, hard copy, or both — every new issue delivered automatically for your plan period.</p>

      <label className="mb-8 flex w-fit items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm">
        <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} className="accent-primary" />
        Enable Autopay (charges automatically each renewal via UPI Autopay / card mandate)
      </label>

      {!plans ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : plans.length === 0 ? (
        <p className="text-gray-500">No subscription plans are available right now.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onSubscribe={() => handleSubscribe(plan)} />
          ))}
        </div>
      )}
      {busyPlanId && <p className="mt-4 text-center text-sm text-gray-500">Starting checkout…</p>}
    </div>
  );
}
