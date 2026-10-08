import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAdminEditFileSignedUrl, getSubmissionFileSignedUrl } from '@/lib/storage';

/** GET /api/admin/submissions/[id]/download?path=...&adminEdit=1 — signs a manuscript file path for download. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const path = req.nextUrl.searchParams.get('path');
  const adminEdit = req.nextUrl.searchParams.get('adminEdit') === '1';
  if (!path) return NextResponse.json({ error: 'missing_path' }, { status: 400 });

  const url = adminEdit ? await getAdminEditFileSignedUrl(path) : await getSubmissionFileSignedUrl(path);
  return NextResponse.redirect(url);
}
