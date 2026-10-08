import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSubmissionVersion, getSubmission, nextVersionNumber, updateSubmissionStatus } from '@/lib/db/submissions';
import { uploadSubmissionFile } from '@/lib/storage';

const WORD_TYPES = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

/** POST /api/submissions/[id]/resubmit — multipart: word (.doc/.docx only). Only when status = revision_required. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission || submission.userId !== session.userId) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (submission.status !== 'revision_required') {
    return NextResponse.json({ error: 'not_resubmittable', message: 'This submission is not awaiting revision.' }, { status: 400 });
  }

  const form = await req.formData();
  const wordFile = form.get('word') as File | null;
  if (!wordFile) {
    return NextResponse.json({ error: 'missing_file', message: 'A Word (.doc/.docx) file is required.' }, { status: 400 });
  }
  if (wordFile.type && !WORD_TYPES.includes(wordFile.type) && !/\.(docx?|DOCX?)$/.test(wordFile.name)) {
    return NextResponse.json({ error: 'invalid_file_type', message: 'Only Microsoft Word (.doc/.docx) files are accepted.' }, { status: 400 });
  }

  const versionNumber = await nextVersionNumber(id);
  const wordPath = await uploadSubmissionFile(
    id,
    versionNumber,
    'word',
    Buffer.from(await wordFile.arrayBuffer()),
    wordFile.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );

  await createSubmissionVersion({ submissionId: id, versionNumber, wordPath, submittedBy: 'user' });
  const updated = await updateSubmissionStatus(id, 'resubmitted');

  return NextResponse.json({ submission: updated });
}
