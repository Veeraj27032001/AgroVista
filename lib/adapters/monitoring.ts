import 'server-only';
import { config } from '@/lib/config';

/**
 * Thin error-monitoring wrapper gated by SENTRY_ENABLED. When disabled (the
 * default), this just logs to the console. To turn it on: `npm install
 * @sentry/nextjs`, set SENTRY_ENABLED=true and SENTRY_DSN, and swap the body
 * of captureException below for a real `Sentry.captureException(err)` call
 * (dynamically imported so the package stays optional while disabled).
 */
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!config.sentry.enabled || !config.sentry.dsn) {
    console.error('[monitoring:disabled]', err, context || '');
    return;
  }
  console.error('[monitoring:sentry-not-installed] Set up @sentry/nextjs to actually report this:', err, context || '');
}
