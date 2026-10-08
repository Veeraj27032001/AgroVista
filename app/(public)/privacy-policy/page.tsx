import LegalPage from '@/components/public/LegalPage';

export const metadata = { title: 'Privacy Policy — AgriOxen Monthly' };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <p>
        This Privacy Policy explains how <span className="placeholder">[Legal Entity Name]</span> (&quot;AgriOxen Monthly&quot;, &quot;we&quot;,
        &quot;us&quot;) collects, uses, and protects your information when you use this website.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li>Account details: name, email, phone number, password (stored hashed), and address/location.</li>
        <li>Payment information: processed entirely by Razorpay — we never store card or banking details on our servers.</li>
        <li>Content you provide: article manuscripts, co-author details, support messages.</li>
        <li>Usage data: pages visited, device/browser information, for security and service improvement.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and manage your account, process orders and subscriptions, and deliver purchased content.</li>
        <li>To process article submissions, editorial communication, and publication-charge payments.</li>
        <li>To send transactional emails (order confirmations, OTPs, status updates) and, where you&apos;ve opted in, marketing communication.</li>
        <li>To comply with tax and legal record-keeping obligations (e.g. GST invoices).</li>
      </ul>

      <h2>3. Sharing of Information</h2>
      <p>
        We share information only with service providers necessary to operate the platform: Razorpay (payments), our email provider, and
        SMS provider (where enabled). We do not sell personal information to third parties.
      </p>

      <h2>4. Data Retention</h2>
      <p>
        Account and transaction records are retained as long as your account is active and as required by law (invoices in particular must
        be retained for the statutory period under GST rules). You may request deletion of your account; some records (e.g. issued invoices)
        are retained regardless, as required by law.
      </p>

      <h2>5. Your Rights</h2>
      <p>You may access, correct, or request deletion of your personal data by contacting us (see Contact Us).</p>

      <h2>6. Contact</h2>
      <p>
        Questions about this policy: <span className="placeholder">[support email]</span>
      </p>
    </LegalPage>
  );
}
