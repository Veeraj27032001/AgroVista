import { NextRequest, NextResponse } from 'next/server';
import { getSession, isStaffRole } from '@/lib/auth';
import { getSubmission, scheduleSubmission } from '@/lib/db/submissions';
import { getIssueWithMeta } from '@/lib/db/catalog';
import { notifyScheduled } from '@/lib/article-notifications';

/** POST /api/admin/submissions/[id]/schedule  { issueId, pageFrom?, pageTo? } — links the submission to a real issues(id) row (spec §7.6 step 4). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !isStaffRole(session.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = await getSubmission(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (existing.status !== 'payment_completed') {
    return NextResponse.json({ error: 'not_payment_completed', message: 'Payment must be completed before scheduling.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { issueId, pageFrom, pageTo } = body as Record<string, unknown>;
  if (!issueId) return NextResponse.json({ error: 'missing_issue' }, { status: 400 });

  const issue = await getIssueWithMeta(String(issueId));
  if (!issue) return NextResponse.json({ error: 'issue_not_found' }, { status: 404 });

  const submission = await scheduleSubmission(id, {
    issueId: issue.id,
    volumeNumber: issue.volumeNumber ?? null,
    issueNumber: issue.slotNumber ?? null,
    publicationMonth: null,
    publicationYear: issue.year ?? null,
    pageFrom: pageFrom ? Number(pageFrom) : undefined,
    pageTo: pageTo ? Number(pageTo) : undefined
  });
  await notifyScheduled(submission);
  return NextResponse.json({ submission });
}
