import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { config } from './config';

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when that env var is set. */
export function requireCronSecret(req: NextRequest): NextResponse | null {
  if (!config.cronSecret) return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 });
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${config.cronSecret}`) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return null;
}
