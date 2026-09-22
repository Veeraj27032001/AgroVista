import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getIssueWithPdfPath } from '@/lib/db/catalog';
import { hasPdfAccess } from '@/lib/subscription';
import { getIssuePdfSignedUrl } from '@/lib/storage';

/**
 * GET /api/download/[id] — plan §10.1 PDF Access Check.
 * Verifies purchase/subscription access, then returns a short-lived (15 min)
 * signed URL from Supabase Storage. The raw storage path is never returned.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const issue = await getIssueWithPdfPath(id);
  if (!issue || issue.status !== 'published') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (!issue.pdfStoragePath) {
    return NextResponse.json({ error: 'no_pdf', message: 'No PDF has been uploaded for this issue yet.' }, { status: 404 });
  }

  const allowed = await hasPdfAccess(session.userId, issue);
  if (!allowed) {
    return NextResponse.json({ error: 'forbidden', message: 'You do not have access to this issue.' }, { status: 403 });
  }

  const url = await getIssuePdfSignedUrl(issue.pdfStoragePath);
  return NextResponse.json({ url, expiresInSeconds: 900 });
}
