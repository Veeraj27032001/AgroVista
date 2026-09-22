import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createIssue, listAllIssuesForAdmin, updateIssue } from '@/lib/db/catalog';
import { uploadIssuePdf, uploadPoster } from '@/lib/storage';
import { autoDeliverToHardCopySubscribers } from '@/lib/subscription';

/** Special editions are issues with isSpecialEdition=true, linked to a volume only (no slot). */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const all = await listAllIssuesForAdmin();
  return NextResponse.json({ issues: all.filter((i) => i.isSpecialEdition) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const form = await req.formData();
  const title = String(form.get('title') || '').trim();
  const volumeId = (form.get('volumeId') as string) || null;
  if (!title || !volumeId) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const status = form.get('status') === 'published' ? 'published' : 'draft';

  const issue = await createIssue({
    volumeId,
    slotId: null,
    isSpecialEdition: true,
    title,
    description: (form.get('description') as string) || undefined,
    language: (form.get('language') as string) || undefined,
    softCopyRate: form.get('softCopyRate') ? Number(form.get('softCopyRate')) : undefined,
    hardCopyRate: form.get('hardCopyRate') ? Number(form.get('hardCopyRate')) : undefined,
    bothRate: form.get('bothRate') ? Number(form.get('bothRate')) : undefined,
    couponApplicable: form.get('couponApplicable') !== 'false',
    status: 'draft'
  });

  const posterFile = form.get('poster') as File | null;
  const pdfFile = form.get('pdf') as File | null;
  let posterUrl: string | undefined;
  let pdfStoragePath: string | undefined;
  if (posterFile && posterFile.size > 0) posterUrl = await uploadPoster(issue.id, Buffer.from(await posterFile.arrayBuffer()), posterFile.type || 'image/jpeg');
  if (pdfFile && pdfFile.size > 0) pdfStoragePath = await uploadIssuePdf(issue.id, Buffer.from(await pdfFile.arrayBuffer()), pdfFile.type || 'application/pdf');

  const finalIssue = await updateIssue(issue.id, { posterUrl, pdfStoragePath, status });
  if (status === 'published') await autoDeliverToHardCopySubscribers(finalIssue);

  return NextResponse.json({ issue: finalIssue });
}
