import LegalPage from '@/components/public/LegalPage';

export const metadata = { title: 'Shipping & Delivery Policy — AgriOxen Monthly' };

export default function ShippingPolicyPage() {
  return (
    <LegalPage title="Shipping & Delivery Policy" updated="October 2026">
      <h2>What Ships</h2>
      <p>
        Print and Bundle format issues are physically printed and shipped to the delivery address provided at checkout (or your
        subscription&apos;s saved delivery address). Digital issues are never shipped — they unlock instantly for online reading.
      </p>

      <h2>Shipping Fees</h2>
      <p>
        A flat shipping fee applies per order containing print items, shown at checkout before payment; orders above a set value may ship
        free. Subscription pricing already includes shipping for each issue delivered under that plan.
      </p>

      <h2>Dispatch & Delivery Timeline</h2>
      <ul>
        <li>Single-copy orders enter our dispatch queue once payment is confirmed and are typically packed within a few business days.</li>
        <li>Subscriber copies are dispatched as each new issue is published.</li>
        <li>Once shipped, you&apos;ll receive an email with the courier name and tracking link. Delivery timelines depend on your location and the courier.</li>
      </ul>

      <h2>Tracking Your Order</h2>
      <p>Track any print order or subscription issue from its Order Detail / Subscription Detail page in your account.</p>

      <h2>Problems With Delivery</h2>
      <p>
        If a copy doesn&apos;t arrive, arrives damaged, or is the wrong issue, use &quot;Report a problem&quot; from the relevant order or
        subscription page within the window described in our <a href="/refund-policy">Refund &amp; Cancellation Policy</a>.
      </p>
    </LegalPage>
  );
}
