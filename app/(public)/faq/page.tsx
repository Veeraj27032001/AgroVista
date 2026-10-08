import LegalPage from '@/components/public/LegalPage';

export const metadata = { title: 'Frequently Asked Questions — AgriOxen Monthly' };

const FAQS: { q: string; a: string }[] = [
  { q: 'How do I read an issue after buying it?', a: 'Sign in and open the issue from your Account → My Library. Digital issues unlock immediately after payment.' },
  { q: 'Can I read on more than one device?', a: 'Yes — access follows your account, not a specific device.' },
  { q: 'What’s the difference between Digital, Print, and Bundle?', a: 'Digital gives online reading access. Print ships a physical copy to your address. Bundle includes both.' },
  { q: 'How do subscriptions work?', a: 'Choose a plan on the Plans page, pay once or set up Autopay, and receive each new issue automatically for the length of your plan.' },
  { q: 'Can I cancel my subscription?', a: 'Yes, from Account → Subscriptions. Autopay subscriptions stop renewing but issues already paid for are still delivered; one-time plans run their full paid term.' },
  { q: 'My print copy hasn’t arrived — what do I do?', a: 'Check tracking on the Order Detail page. If it’s overdue, use “Report a problem” from that page for a replacement or refund.' },
  { q: 'How do I submit an article?', a: 'Go to Submit Article, fill in the theme, title, author details, and upload your manuscript (.doc/.docx only). See our Author Guidelines for full requirements.' },
  { q: 'Who pays the publication charge for an accepted article?', a: 'Any author or co-author can pay the full amount, or several can each contribute a share via the shared payment link — whichever is easiest for your team.' },
  { q: 'Is my payment information safe?', a: 'Yes. All payments are processed by Razorpay; we never see or store your card or banking details.' },
  { q: 'How do I get a GST invoice?', a: 'Every payment automatically generates an invoice, downloadable from Account → Payments & Invoices.' }
];

export default function FaqPage() {
  return (
    <LegalPage title="Frequently Asked Questions" updated="October 2026">
      {FAQS.map((item) => (
        <div key={item.q} className="mb-4">
          <h3>{item.q}</h3>
          <p>{item.a}</p>
        </div>
      ))}
    </LegalPage>
  );
}
