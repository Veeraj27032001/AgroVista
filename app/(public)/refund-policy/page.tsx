import LegalPage from '@/components/public/LegalPage';

export const metadata = { title: 'Refund & Cancellation Policy — AgriOxen Monthly' };

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="October 2026">
      <h2>Digital Issues</h2>
      <p>
        Digital issue purchases are non-refundable once the issue has been unlocked for reading, except where access fails due to a
        technical fault on our end — contact support and we will restore access or refund you.
      </p>

      <h2>Print Issues</h2>
      <ul>
        <li>You may cancel a print order for a full refund (including shipping) any time before it is marked as shipped.</li>
        <li>If your copy arrives damaged, with missing pages, or is the wrong issue, report it within 7 days of delivery with a photo — we will replace it or refund you.</li>
        <li>If a copy is not received by the expected delivery date (plus 3 days), contact support for a replacement or refund.</li>
      </ul>

      <h2>Subscriptions</h2>
      <ul>
        <li>One-time (non-autopay) subscriptions: full refund if cancelled before the first issue is allocated; no refund after, by default.</li>
        <li>Autopay subscriptions: switching off autopay stops future renewals but does not refund the current paid term; issues already paid for are still delivered.</li>
      </ul>

      <h2>Article Publication Charges</h2>
      <p>
        If your article is rejected, withdrawn, or the payment deadline expires and the editorial team declines to extend it, every
        contribution already made toward that article&apos;s publication charge is refunded in full to the original contributor.
      </p>

      <h2>How Refunds Are Processed</h2>
      <p>
        All refunds are issued via Razorpay back to the original payment method and typically reflect within 5–7 business days, depending
        on your bank. A credit note is issued for every refund alongside the original invoice.
      </p>

      <h2>Requesting a Refund</h2>
      <p>
        Use the &quot;Report a problem&quot; action on the relevant Order or Subscription page in your account, or contact{' '}
        <span className="placeholder">[support email]</span>.
      </p>
    </LegalPage>
  );
}
