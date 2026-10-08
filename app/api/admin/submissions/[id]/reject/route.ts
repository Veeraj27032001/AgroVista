import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { rejectSubmission } from '@/lib/db/submissions';
import { notifyRejected } from '@/lib/article-notifications';

/** POST /api/admin/submissions/[id]/reject  { reason } */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason || '').trim();
  if (!reason) return NextResponse.json({ error: 'missing_reason', message: 'A rejection reason is required.' }, { status: 400 });

  const submission = await rejectSubmission(id, reason);
  await notifyRejected(submission, reason);
  return NextResponse.json({ submission });
}
