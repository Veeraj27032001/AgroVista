import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubmission } from '@/lib/db/submissions';
import { recordAuthorPayout } from '@/lib/db/author-payouts';
import { notifyAuthorPayoutRecorded } from '@/lib/author-notifications';

/** POST /api/admin/submissions/[id]/payouts  { recipientName, recipientEmail, amount, method?, referenceNote? } — admin records a manual payment made outside the platform. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const recipientName = String(body.recipientName || '').trim();
  const recipientEmail = String(body.recipientEmail || '').trim();
  const amount = Number(body.amount);
  const method = ['upi', 'bank_transfer', 'other'].includes(body.method) ? body.method : undefined;
  const referenceNote = body.referenceNote ? String(body.referenceNote).trim() : undefined;

  if (!recipientName || !recipientEmail) return NextResponse.json({ error: 'missing_recipient' }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'invalid_amount' }, { status: 400 });

  const payout = await recordAuthorPayout({
    submissionId: id,
    recipientName,
    recipientEmail,
    amount,
    method,
    referenceNote,
    paidBy: session.userId
  });
  await notifyAuthorPayoutRecorded(recipientEmail, recipientName, amount, submission.title);

  return NextResponse.json({ payout });
}
