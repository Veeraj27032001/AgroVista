import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubmission, listVersionsForSubmission } from '@/lib/db/submissions';

/** Detail view for the admin Submission Detail page (§8.13): submission + its version history. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const versions = await listVersionsForSubmission(id);
  return NextResponse.json({ submission, versions });
}
