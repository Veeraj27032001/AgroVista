import { NextResponse } from 'next/server';
import { getIssue } from '@/lib/db/catalog';
import { getSession } from '@/lib/auth';
import { hasPdfAccess } from '@/lib/subscription';
import { hasHardCopyAccess } from '@/lib/db/orders';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue || issue.status !== 'published') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const session = await getSession();
  const hasAccess = session ? await hasPdfAccess(session.userId, issue) : false;
  const hasHardCopy = session ? await hasHardCopyAccess(session.userId, issue.id) : false;

  return NextResponse.json({ issue, hasAccess, hasHardCopy });
}
