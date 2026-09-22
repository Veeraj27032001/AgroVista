import type { SubscriptionPlan } from '@/lib/types';
import Button from '../ui/Button';

export default function PlanCard({ plan, onSubscribe }: { plan: SubscriptionPlan; onSubscribe: (plan: SubscriptionPlan) => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 p-6 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-primary">{plan.format} copy</span>
      <h3 className="mt-1 font-serif text-xl font-bold">{plan.name}</h3>
      <p className="text-sm text-gray-500">{plan.durationLabel}</p>
      <p className="mt-4 text-3xl font-bold text-ink">₹{plan.price}</p>
      <Button className="mt-6" onClick={() => onSubscribe(plan)}>
        Subscribe
      </Button>
    </div>
  );
}
