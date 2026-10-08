import LegalPage from '@/components/public/LegalPage';
import { ARTICLE_THEMES } from '@/lib/types';

export const metadata = { title: 'Author Guidelines — AgriOxen Monthly' };

export default function AuthorGuidelinesPage() {
  return (
    <LegalPage title="Author Guidelines" updated="October 2026">
      <p>Thank you for considering AgriOxen Monthly for your article. Please review these guidelines before submitting.</p>

      <h2>Manuscript Requirements</h2>
      <ul>
        <li>Microsoft Word format only — .doc or .docx. PDF, images, and other formats are not accepted for the manuscript itself.</li>
        <li>Maximum 2,000 words, or approximately 5–6 pages.</li>
        <li>Original work only — not previously published elsewhere, and not infringing any third party&apos;s copyright.</li>
      </ul>

      <h2>Themes We Cover</h2>
      <ul>
        {ARTICLE_THEMES.filter((t) => t !== 'Other').map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p>If your article doesn&apos;t fit a listed theme, choose &quot;Other&quot; and describe it briefly.</p>

      <h2>Author &amp; Co-Author Details</h2>
      <p>
        For the primary author and every co-author, please have ready: full name, email, contact number, affiliation/organization,
        designation, city, state, and country. You can add or remove co-authors at any point before final submission.
      </p>

      <h2>What Happens After Submission</h2>
      <ol>
        <li>You receive a unique Article ID and a confirmation email.</li>
        <li>Our editorial team reviews the manuscript — you may be asked for revisions.</li>
        <li>On acceptance, a publication charge is set and a payment link is shared with all authors — any combination of authors may contribute toward it.</li>
        <li>Once fully paid, the article is scheduled into an upcoming issue and published.</li>
      </ol>

      <h2>Publication Charge</h2>
      <p>
        Accepted articles carry a publication charge, communicated at the time of acceptance. It may be paid in full by one author or
        split across any number of authors via the shared payment link.
      </p>

      <h2>Questions</h2>
      <p>
        Reach the editorial desk via <a href="/contact">Contact Us</a>.
      </p>
    </LegalPage>
  );
}
