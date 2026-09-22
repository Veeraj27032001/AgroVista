import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSubmissionVersion, getSubmission, nextVersionNumber, updateSubmissionStatus } from '@/lib/db/submissions';
import { uploadSubmissionFile } from '@/lib/storage';

/** POST /api/submissions/[id]/resubmit — multipart: word, pdf. Only when status = revision_requested. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission || submission.userId !== session.userId) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (submission.status !== 'revision_requested') {
    return NextResponse.json({ error: 'not_resubmittable', message: 'This submission is not awaiting revision.' }, { status: 400 });
  }

  const form = await req.formData();
  const wordFile = form.get('word') as File | null;
  const pdfFile = form.get('pdf') as File | null;
  if (!wordFile || !pdfFile) {
    return NextResponse.json({ error: 'missing_files', message: 'Both a Word file and a PDF file are required.' }, { status: 400 });
  }

  const versionNumber = await nextVersionNumber(id);
  const wordPath = await uploadSubmissionFile(
    id,
    versionNumber,
    'word',
    Buffer.from(await wordFile.arrayBuffer()),
    wordFile.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
  const pdfPath = await uploadSubmissionFile(id, versionNumber, 'pdf', Buffer.from(await pdfFile.arrayBuffer()), pdfFile.type || 'application/pdf');

  await createSubmissionVersion({ submissionId: id, versionNumber, wordPath, pdfPath, submittedBy: 'user' });
  const updated = await updateSubmissionStatus(id, 'resubmitted');

  return NextResponse.json({ submission: updated });
}
