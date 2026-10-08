import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubmission, listCoAuthors, listVersionsForSubmission } from '@/lib/db/submissions';
import { listPaymentsForSubmission } from '@/lib/db/article-payments';

/** Detail view for the admin Submission Detail page: submission + version history + co-authors + payment ledger. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const [versions, coAuthors, payments] = await Promise.all([
    listVersionsForSubmission(id),
    listCoAuthors(id),
    listPaymentsForSubmission(id)
  ]);
  return NextResponse.json({ submission, versions, coAuthors, payments });
}
