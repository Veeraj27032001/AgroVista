import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createIssue, getSlot, listAllIssuesForAdmin, updateIssue } from '@/lib/db/catalog';
import { uploadIssuePdf, uploadPoster } from '@/lib/storage';
import { autoDeliverToHardCopySubscribers } from '@/lib/subscription';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ issues: await listAllIssuesForAdmin() });
}

/** POST /api/admin/issues — multipart: slotId|volumeId, title, description, language, poster, pdf, rates, status */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const form = await req.formData();
  const title = String(form.get('title') || '').trim();
  if (!title) return NextResponse.json({ error: 'missing_title' }, { status: 400 });

  const isSpecialEdition = form.get('isSpecialEdition') === 'true';
  const slotId = (form.get('slotId') as string) || null;
  let volumeId = (form.get('volumeId') as string) || null;
  const status = (form.get('status') as string) === 'published' ? 'published' : 'draft';

  // Regular issues only submit a slotId, but listing/filtering joins through
  // volume_id, so resolve and store it too — not just slot_id.
  if (!isSpecialEdition && slotId) {
    const slot = await getSlot(slotId);
    volumeId = slot?.volumeId || null;
  }

  const issue = await createIssue({
    slotId: isSpecialEdition ? null : slotId,
    volumeId,
    isSpecialEdition,
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
  if (posterFile && posterFile.size > 0) {
    posterUrl = await uploadPoster(issue.id, Buffer.from(await posterFile.arrayBuffer()), posterFile.type || 'image/jpeg');
  }
  if (pdfFile && pdfFile.size > 0) {
    pdfStoragePath = await uploadIssuePdf(issue.id, Buffer.from(await pdfFile.arrayBuffer()), pdfFile.type || 'application/pdf');
  }

  const finalIssue = await updateIssue(issue.id, { posterUrl, pdfStoragePath, status });

  if (status === 'published') await autoDeliverToHardCopySubscribers(finalIssue);

  return NextResponse.json({ issue: finalIssue });
}
