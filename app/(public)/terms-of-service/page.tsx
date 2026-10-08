import LegalPage from '@/components/public/LegalPage';

export const metadata = { title: 'Terms of Service — AgriOxen Monthly' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 2026">
      <p>
        These Terms govern your use of AgriOxen Monthly, operated by <span className="placeholder">[Legal Entity Name]</span>. By creating
        an account or using the site, you agree to these Terms.
      </p>

      <h2>1. Accounts</h2>
      <p>
        You must provide accurate information when registering. You are responsible for keeping your password secure and for all activity
        under your account.
      </p>

      <h2>2. Purchases &amp; Subscriptions</h2>
      <p>
        Prices shown include applicable GST. Digital issues are unlocked for reading immediately after payment; print issues are shipped per
        the delivery address provided at checkout. Subscriptions renew as described on the Plans page and may be cancelled as described in
        your Account → Subscriptions page.
      </p>

      <h2>3. Article Submissions</h2>
      <p>
        By submitting an article, you confirm it is your own original work (or that of the listed co-authors), has not been published
        elsewhere, and does not infringe any third party&apos;s rights. Acceptance is at the sole discretion of our editorial team. A
        publication charge, where applicable, is payable before scheduling and publication. See our{' '}
        <a href="/author-guidelines">Author Guidelines</a> for full submission requirements.
      </p>

      <h2>4. Payments</h2>
      <p>All payments are processed by Razorpay. We do not store your card or banking details.</p>

      <h2>5. Prohibited Use</h2>
      <p>
        You may not use the site to upload unlawful, infringing, or harmful content, attempt to access other users&apos; accounts or data,
        or interfere with the platform&apos;s normal operation.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        AgriOxen Monthly is provided &quot;as is&quot;. To the maximum extent permitted by law, we are not liable for indirect or
        consequential losses arising from use of the site.
      </p>

      <h2>7. Changes to These Terms</h2>
      <p>We may update these Terms from time to time. Continued use of the site after changes take effect constitutes acceptance.</p>

      <h2>8. Governing Law</h2>
      <p>
        These Terms are governed by the laws of India, with courts of <span className="placeholder">[City, State]</span> having exclusive
        jurisdiction.
      </p>
    </LegalPage>
  );
}
