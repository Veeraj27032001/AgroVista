import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubmission, markSubmissionPublished } from '@/lib/db/submissions';
import { notifyPublished } from '@/lib/article-notifications';

/** POST /api/admin/submissions/[id]/publish  { articleUrl? } — final step after scheduling. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = await getSubmission(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (existing.status !== 'scheduled') {
    return NextResponse.json({ error: 'not_scheduled', message: 'Schedule the article before publishing it.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const submission = await markSubmissionPublished(id, body.articleUrl ? String(body.articleUrl) : undefined);
  await notifyPublished(submission);
  return NextResponse.json({ submission });
}
