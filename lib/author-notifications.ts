import 'server-only';
import { getNotifierAdapter } from './adapters/notifier';

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

export async function notifyAuthorRequestApproved(email: string, name: string) {
  await send(
    email,
    'You are now an AgriOxen Author',
    wrap('Author Status Approved', `<p>Hi ${name},</p><p>Your request to become an Author on AgriOxen has been approved. You can now submit articles for publication from your account.</p>`)
  );
}

export async function notifyAuthorRequestRejected(email: string, name: string, note?: string) {
  await send(
    email,
    'Your Author request on AgriOxen',
    wrap(
      'Author Request Not Approved',
      `<p>Hi ${name},</p><p>We're unable to approve your request to become an Author at this time.</p>${note ? `<p style="background:#f6f2e7;padding:12px;border-radius:8px">${note}</p>` : ''}`
    )
  );
}

export async function notifyAuthorPayoutRecorded(email: string, name: string, amount: number, articleTitle: string) {
  await send(
    email,
    `Payment recorded — ${articleTitle}`,
    wrap(
      'Payment Recorded',
      `<p>Hi ${name},</p><p>A payment of <strong>₹${amount}</strong> has been recorded for your article <strong>${articleTitle}</strong>. Please check your bank/UPI account for the transfer.</p>`
    )
  );
}
