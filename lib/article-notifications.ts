import 'server-only';
import { getNotifierAdapter } from './adapters/notifier';
import { config } from './config';
import type { ArticleSubmission } from './types';

function send(to: string, subject: string, html: string) {
  return getNotifierAdapter().sendEmail({ to, subject, html });
}

function wrap(title: string, body: string): string {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
    <h2 style="color:#4C7A3F">${title}</h2>
    <div>${body}</div>
    <p style="color:#888;font-size:12px;margin-top:24px">AgriOxen Editorial Team</p>
  </div>`;
}

export async function notifySubmissionReceived(s: ArticleSubmission) {
  await send(
    s.authorEmail || '',
    `Submission received — ${s.articleCode}`,
    wrap('Submission Received', `<p>Thank you for submitting <strong>${s.title}</strong> (Article ID ${s.articleCode}) to AgriOxen. Our editorial team will review it shortly.</p>`)
  );
}

export async function notifyUnderReview(s: ArticleSubmission) {
  await send(
    s.authorEmail || '',
    `Your article is under review — ${s.articleCode}`,
    wrap('Article Under Review', `<p>Your article <strong>${s.title}</strong> (${s.articleCode}) is now under editorial review.</p>`)
  );
}

export async function notifyRevisionRequired(s: ArticleSubmission, note: string) {
  await send(
    s.authorEmail || '',
    `Revision required — ${s.articleCode}`,
    wrap('Revision Required', `<p>The editorial team has requested revisions for <strong>${s.title}</strong> (${s.articleCode}):</p><p style="background:#f6f2e7;padding:12px;border-radius:8px">${note}</p><p>Please log in to your dashboard to upload a revised manuscript.</p>`)
  );
}

export async function notifyRejected(s: ArticleSubmission, reason: string) {
  await send(
    s.authorEmail || '',
    `Article decision — ${s.articleCode}`,
    wrap('Article Not Accepted', `<p>We're sorry to inform you that <strong>${s.title}</strong> (${s.articleCode}) was not accepted for publication.</p><p style="background:#f6f2e7;padding:12px;border-radius:8px">${reason}</p>`)
  );
}

export async function notifyAccepted(s: ArticleSubmission) {
  const link = `${config.appUrl}/pay/${s.contributionToken}`;
  await send(
    s.authorEmail || '',
    `Article accepted — ${s.articleCode}`,
    wrap(
      'Article Accepted',
      `<p>Congratulations! Your article <strong>${s.title}</strong> (${s.articleCode}) has been accepted for publication.</p>
       <p>Publication charge: <strong>₹${s.publicationCharge}</strong></p>
       <p>Complete the payment, or share this link with your co-authors so they can each contribute: <a href="${link}">${link}</a></p>`
    )
  );
}

export async function notifyPartialPaymentReceived(s: ArticleSubmission, contributorName: string, amount: number) {
  const balance = (s.publicationCharge || 0) - s.amountPaid;
  await send(
    s.authorEmail || '',
    `Partial payment received — ${s.articleCode}`,
    wrap(
      'Partial Payment Received',
      `<p>${contributorName} contributed ₹${amount} toward the publication charge for <strong>${s.title}</strong> (${s.articleCode}).</p>
       <p>Amount paid so far: ₹${s.amountPaid} · Balance remaining: ₹${balance}</p>`
    )
  );
}

export async function notifyPaymentCompleted(s: ArticleSubmission) {
  await send(
    s.authorEmail || '',
    `Payment completed — ${s.articleCode}`,
    wrap(
      'Payment Completed',
      `<p>The complete publication charge for your article <strong>${s.title}</strong>, Article ID ${s.articleCode}, has been received successfully. Your article is now in the publication process. The AgriOxen editorial team will schedule your article for publication and inform you soon.</p>`
    )
  );
}

export async function notifyScheduled(s: ArticleSubmission) {
  await send(
    s.authorEmail || '',
    `Article scheduled for publication — ${s.articleCode}`,
    wrap(
      'Article Scheduled',
      `<p><strong>${s.title}</strong> (${s.articleCode}) has been scheduled for publication — Volume ${s.volumeNumber}, Issue ${s.issueNumber}, ${s.publicationMonth}/${s.publicationYear}.</p>`
    )
  );
}

export async function notifyPublished(s: ArticleSubmission) {
  await send(
    s.authorEmail || '',
    `Your article is published! — ${s.articleCode}`,
    wrap(
      'Article Published',
      `<p>Your article <strong>${s.title}</strong> (${s.articleCode}) has been published — Volume ${s.volumeNumber}, Issue ${s.issueNumber}.</p>
       ${s.articleUrl ? `<p><a href="${s.articleUrl}">View the published article</a></p>` : ''}`
    )
  );
}
