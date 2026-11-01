import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listSubmissionsByScheduledIssue } from '@/lib/db/submissions';

/** GET /api/admin/issues/[id]/submissions — every article currently scheduled/linked into this issue. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  return NextResponse.json({ submissions: await listSubmissionsByScheduledIssue(id) });
}
