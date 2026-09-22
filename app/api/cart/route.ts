import { NextRequest, NextResponse } from 'next/server';
import { getIssue } from '@/lib/db/catalog';
import type { Format } from '@/lib/types';

const RATE_FIELD: Record<Format, 'softCopyRate' | 'hardCopyRate' | 'bothRate'> = {
  soft: 'softCopyRate',
  hard: 'hardCopyRate',
  both: 'bothRate'
};

/**
 * Cart is stored client-side (localStorage) — this endpoint just hydrates a
 * list of { issueId, format } lines with current issue title/poster/price so
 * the Cart and Checkout pages always show live data, not a stale local copy.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const items: { issueId: string; format: Format }[] = Array.isArray(body.items) ? body.items : [];

  const lines = await Promise.all(
    items.map(async (item) => {
      const issue = await getIssue(item.issueId);
      if (!issue || issue.status !== 'published') return null;
      const price = issue[RATE_FIELD[item.format]];
      if (price === null || price === undefined) return null;
      return {
        issueId: issue.id,
        title: issue.title,
        posterUrl: issue.posterUrl,
        format: item.format,
        price,
        couponApplicable: issue.couponApplicable
      };
    })
  );

  const validLines = lines.filter((l): l is NonNullable<typeof l> => l !== null);
  const subtotal = validLines.reduce((sum, l) => sum + l.price, 0);
  return NextResponse.json({ lines: validLines, subtotal });
}
