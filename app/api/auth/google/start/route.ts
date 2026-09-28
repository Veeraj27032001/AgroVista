import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET(req: NextRequest) {
  const redirect = req.nextUrl.searchParams.get('redirect') || '/';
  const state = crypto.randomUUID();

  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', config.google.clientId);
  googleUrl.searchParams.set('redirect_uri', `${config.appUrl}/api/auth/google/callback`);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', state);
  googleUrl.searchParams.set('prompt', 'select_account');

  const res = NextResponse.redirect(googleUrl.toString());
  res.cookies.set('google_oauth_state', JSON.stringify({ state, redirect }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 600,
    path: '/'
  });
  return res;
}
