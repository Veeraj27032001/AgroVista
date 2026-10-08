import { NextResponse } from 'next/server';
import { getSubmissionByToken } from '@/lib/db/submissions';

/** GET /api/articles/[token] — public: minimal info for the shared contribution-payment page. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const submission = await getSubmissionByToken(token);
  if (!submission) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const balance = (submission.publicationCharge || 0) - submission.amountPaid;
  return NextResponse.json({
    articleCode: submission.articleCode,
    title: submission.title,
    status: submission.status,
    publicationCharge: submission.publicationCharge,
    amountPaid: submission.amountPaid,
    balance: Math.max(0, balance)
  });
}
