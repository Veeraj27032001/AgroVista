import 'server-only';
import { getActiveSubscriptionForUser } from './db/subscriptions';
import { hasSoftCopyAccess, createSubscriptionCoveredOrder } from './db/orders';
import { listActiveHardCopySubscriptions } from './db/catalog';
import { findUserById } from './db/users';
import { getStateName } from './db/locations';
import { hasActiveEntitlement } from './db/entitlements';
import type { Issue } from './types';

/**
 * PDF access check (plan §10.1, migrating to spec §3.5 "entitlements alone
 * decide who can open the reader"): a user can read an issue's PDF if any of
 * — an active entitlement row (the v3 source of truth, populated for new
 *   purchases going forward and backfilled for history by
 *   scripts/backfill-entitlements.mjs),
 * — a paid one-time order covering soft/both format (pre-entitlement data),
 * — an active subscription (format soft/both) whose date range covers the
 *   issue's published_at (subscriptions haven't migrated to entitlements yet).
 */
export async function hasPdfAccess(userId: string, issue: Issue): Promise<boolean> {
  if (await hasActiveEntitlement(userId, issue.id)) return true;
  if (await hasSoftCopyAccess(userId, issue.id)) return true;

  const sub = await getActiveSubscriptionForUser(userId);
  if (!sub || sub.format === 'hard') return false;
  if (!issue.publishedAt) return false;

  const publishedAt = new Date(issue.publishedAt).getTime();
  const start = new Date(sub.startDate).getTime();
  const end = new Date(sub.endDate).getTime();
  return publishedAt >= start && publishedAt <= end;
}

/**
 * Plan §10.2 — when an issue is published, hard/both subscribers get an
 * automatic issue_order (pre-paid, covered by their subscription) so it
 * shows up in their order queue for fulfillment. Soft/both holders need no
 * extra row — their access is automatic via hasPdfAccess above.
 */
export async function autoDeliverToHardCopySubscribers(issue: Issue): Promise<void> {
  const subs = await listActiveHardCopySubscriptions();
  for (const sub of subs) {
    const user = await findUserById(sub.userId);
    if (!user) continue;
    const deliveryState = user.stateId ? (await getStateName(user.stateId)) || undefined : undefined;
    await createSubscriptionCoveredOrder({
      userId: sub.userId,
      issueId: issue.id,
      format: sub.format,
      deliveryName: user.name,
      deliveryAddress: user.address || undefined,
      deliveryCity: user.city || undefined,
      deliveryState,
      deliveryPincode: user.pincode || undefined,
      deliveryPhone: user.phone || undefined
    });
  }
}

export const DURATION_LABEL_TO_MONTHS: Record<string, number> = {
  Quarterly: 3,
  'Half Yearly': 6,
  Yearly: 12,
  '2 Year': 24,
  '5 Year': 60
};
