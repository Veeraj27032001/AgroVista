const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!config.smtp.host) {
    // No SMTP configured — fall back to logging the link to the console so
    // local development still works without a mail provider.
    return null;
  }
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined
  });
  return transporter;
}

async function sendMagicLink(email, link) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#2B2A1F;">Sign in to AgroVista Monthly</h2>
      <p>Click the button below to sign in. This link expires in ${config.magicLinkExpiryMinutes} minutes and can only be used once.</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${link}" style="background:#E3A93A;color:#ffffff;padding:14px 28px;border-radius:100px;text-decoration:none;font-weight:bold;display:inline-block;">
          Sign in to AgroVista
        </a>
      </p>
      <p style="color:#777;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      <p style="color:#aaa;font-size:12px;">Or paste this link into your browser: ${link}</p>
    </div>`;

  const t = getTransporter();
  if (!t) {
    console.log('\n[DEV MODE — no SMTP configured] Magic login link for', email, ':\n', link, '\n');
    return { devMode: true };
  }

  await t.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Your AgroVista Monthly sign-in link',
    html
  });
  return { devMode: false };
}

module.exports = { sendMagicLink };
