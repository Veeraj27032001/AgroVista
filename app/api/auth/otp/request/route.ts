import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { generateOtpCode, signOtpToken, OTP_COOKIE_NAME } from '@/lib/auth';
import { findUserByEmail, findUserByPhone } from '@/lib/db/users';
import { getNotifierAdapter } from '@/lib/adapters/notifier';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const channel = body.channel === 'phone' ? 'phone' : 'email';
  const value = String(body.value || '').trim();

  if (!value) return NextResponse.json({ error: 'missing_value' }, { status: 400 });

  const user = channel === 'phone' ? await findUserByPhone(value) : await findUserByEmail(value.toLowerCase());

  const res = NextResponse.json({
    ok: true,
    message: `If an account exists, a code has been sent by ${channel === 'phone' ? 'SMS' : 'email'}.`
  });

  if (user) {
    const code = generateOtpCode();
    const token = signOtpToken(user.id, code);
    res.cookies.set(OTP_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.nodeEnv === 'production',
      maxAge: 600,
      path: '/'
    });

    const notifier = getNotifierAdapter();
    if (channel === 'phone') {
      await notifier.sendSms({ to: value, message: `Your AgroVista Monthly sign-in code is ${code}. It expires in 10 minutes.` });
    } else {
      await notifier.sendEmail({
        to: user.email,
        subject: 'Your AgroVista Monthly sign-in code',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#2B2A1F;">Your sign-in code</h2>
            <p>Enter this code to sign in. It expires in 10 minutes.</p>
            <p style="text-align:center;margin:28px 0;font-size:32px;font-weight:bold;letter-spacing:6px;color:#4C7A3F;">${code}</p>
            <p style="color:#777;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
          </div>`
      });
    }
  }

  return res;
}
