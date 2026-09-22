import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { signPasswordResetToken } from '@/lib/auth';
import { findUserByEmail } from '@/lib/db/users';
import { getNotifierAdapter } from '@/lib/adapters/notifier';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid_email', message: 'Please enter a valid email address.' }, { status: 400 });
  }

  const user = await findUserByEmail(email);

  if (user) {
    const token = signPasswordResetToken(user.id);
    const link = `${config.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await getNotifierAdapter().sendEmail({
      to: user.email,
      subject: 'Reset your AgroVista Monthly password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#2B2A1F;">Reset your password</h2>
          <p>Click the button below to choose a new password. This link expires in 30 minutes and can only be used once.</p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${link}" style="background:#E3A93A;color:#ffffff;padding:14px 28px;border-radius:100px;text-decoration:none;font-weight:bold;display:inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color:#777;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color:#aaa;font-size:12px;">Or paste this link into your browser: ${link}</p>
        </div>`
    });
  }

  // Same response whether or not the email exists, so this can't be used to enumerate accounts.
  return NextResponse.json({ ok: true, message: 'If an account exists for that email, a reset link has been sent.' });
}
