import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSubmission, createSubmissionVersion, listSubmissionsForUser } from '@/lib/db/submissions';
import { uploadSubmissionFile } from '@/lib/storage';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  const submissions = await listSubmissionsForUser(session.userId);
  return NextResponse.json({ submissions });
}

/** POST /api/submissions — multipart: title, description, language, word, pdf */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const form = await req.formData();
  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '');
  const language = String(form.get('language') || 'English');
  const wordFile = form.get('word') as File | null;
  const pdfFile = form.get('pdf') as File | null;

  if (!title) return NextResponse.json({ error: 'missing_title' }, { status: 400 });
  if (!wordFile || !pdfFile) {
    return NextResponse.json({ error: 'missing_files', message: 'Both a Word file and a PDF file are required.' }, { status: 400 });
  }

  const submission = await createSubmission({ userId: session.userId, title, description, language });

  const wordPath = await uploadSubmissionFile(
    submission.id,
    1,
    'word',
    Buffer.from(await wordFile.arrayBuffer()),
    wordFile.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
  const pdfPath = await uploadSubmissionFile(submission.id, 1, 'pdf', Buffer.from(await pdfFile.arrayBuffer()), pdfFile.type || 'application/pdf');

  await createSubmissionVersion({ submissionId: submission.id, versionNumber: 1, wordPath, pdfPath, submittedBy: 'user' });

  return NextResponse.json({ submission });
}
