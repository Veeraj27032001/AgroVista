import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSubmission, listVersionsForSubmission, updateSubmissionStatus } from '@/lib/db/submissions';
import { createIssue, getSlot } from '@/lib/db/catalog';
import { autoDeliverToHardCopySubscribers } from '@/lib/subscription';

/**
 * POST /api/admin/submissions/[id]/publish  { slotId, posterUrl, softRate, hardRate, bothRate, language }
 * Plan §14 step 9 — creates the issue from the admin's edited PDF version.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (submission.status !== 'accepted') {
    return NextResponse.json({ error: 'not_accepted', message: 'Accept the submission before publishing it.' }, { status: 400 });
  }

  const versions = await listVersionsForSubmission(id);
  const adminEdit = [...versions].reverse().find((v) => v.isAdminEdit);
  if (!adminEdit) {
    return NextResponse.json(
      { error: 'no_admin_edit', message: 'Upload an admin-edited version before publishing.' },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { slotId, posterUrl, softRate, hardRate, bothRate, language } = body;
  if (!slotId) return NextResponse.json({ error: 'missing_slot' }, { status: 400 });

  const slot = await getSlot(slotId);

  const issue = await createIssue({
    slotId,
    volumeId: slot?.volumeId || null,
    title: submission.title,
    description: submission.description || undefined,
    language: language || submission.language,
    posterUrl,
    pdfStoragePath: adminEdit.pdfPath,
    softCopyRate: softRate,
    hardCopyRate: hardRate,
    bothRate: bothRate,
    status: 'published'
  });

  await updateSubmissionStatus(id, 'accepted', submission.adminNote || undefined);
  await autoDeliverToHardCopySubscribers(issue);

  return NextResponse.json({ issue });
}
