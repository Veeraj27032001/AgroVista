import { NextResponse } from 'next/server';
import { getSession, isStaffRole } from '@/lib/auth';
import { getSubmission, listCoAuthors, listVersionsForSubmission } from '@/lib/db/submissions';
import { listPaymentsForSubmission } from '@/lib/db/article-payments';
import { listPayoutsForSubmission } from '@/lib/db/author-payouts';

/** Detail view for the admin Submission Detail page: submission + version history + co-authors + payment/payout ledgers. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !isStaffRole(session.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (session.role === 'editor' && submission.assignedEditorId !== session.userId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const [versions, coAuthors, payments, payouts] = await Promise.all([
    listVersionsForSubmission(id),
    listCoAuthors(id),
    listPaymentsForSubmission(id),
    listPayoutsForSubmission(id)
  ]);
  return NextResponse.json({ submission, versions, coAuthors, payments, payouts });
}
