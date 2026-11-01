import 'server-only';
import { getNotifierAdapter } from './adapters/notifier';
import { config } from './config';

function send(to: string, subject: string, html: string) {
  return getNotifierAdapter().sendEmail({ to, subject, html });
}

function wrap(title: string, body: string): string {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
    <h2 style="color:#4C7A3F">${title}</h2>
    <div>${body}</div>
    <p style="color:#888;font-size:12px;margin-top:24px">AgriOxen Admin Team</p>
  </div>`;
}

export async function notifyEditorAccountCreated(email: string, name: string, password: string) {
  const loginUrl = `${config.appUrl}/login`;
  await send(
    email,
    'Your AgriOxen Editor account',
    wrap(
      'Editor Account Created',
      `<p>Hi ${name},</p>
       <p>An AgriOxen Editor account has been created for you.</p>
       <p><strong>Email:</strong> ${email}<br/><strong>Password:</strong> ${password}</p>
       <p>Sign in here and change your password after your first login: <a href="${loginUrl}">${loginUrl}</a></p>`
    )
  );
}
