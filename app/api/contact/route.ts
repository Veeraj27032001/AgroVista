import { NextRequest, NextResponse } from 'next/server';
import { getNotifierAdapter } from '@/lib/adapters/notifier';
import { getSiteContentMap } from '@/lib/db/site-content';

/** POST /api/contact — public contact form (Home page + Contact Us page). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const message = String(body.message || '').trim();

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'missing_fields', message: 'Name, email and message are required.' }, { status: 400 });
  }

  const content = await getSiteContentMap();
  const to = content.contact_email || process.env.SMTP_USER || '';
  if (!to) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  await getNotifierAdapter().sendEmail({
    to,
    subject: `Website contact form — ${name}`,
    html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${message.replace(/\n/g, '<br/>')}</p>`
  });

  return NextResponse.json({ ok: true });
}
