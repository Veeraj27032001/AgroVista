import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSubmission, createSubmissionVersion, listSubmissionsForUser, type CoAuthorInput } from '@/lib/db/submissions';
import { uploadSubmissionFile } from '@/lib/storage';
import { notifySubmissionReceived } from '@/lib/article-notifications';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  const submissions = await listSubmissionsForUser(session.userId);
  return NextResponse.json({ submissions });
}

const WORD_TYPES = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

/** POST /api/submissions — multipart: title, description, language, theme, themeOther, authorDetails (JSON), coAuthors (JSON), declaration, word */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const form = await req.formData();
  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '');
  const language = String(form.get('language') || 'English');
  const theme = String(form.get('theme') || '').trim();
  const themeOther = String(form.get('themeOther') || '').trim();
  const declaration = form.get('declaration') === 'true';
  const wordFile = form.get('word') as File | null;

  let authorDetails: Record<string, string> = {};
  let coAuthors: CoAuthorInput[] = [];
  try {
    authorDetails = JSON.parse(String(form.get('authorDetails') || '{}'));
    coAuthors = JSON.parse(String(form.get('coAuthors') || '[]'));
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  if (!title) return NextResponse.json({ error: 'missing_title' }, { status: 400 });
  if (!theme) return NextResponse.json({ error: 'missing_theme' }, { status: 400 });
  if (!declaration) {
    return NextResponse.json({ error: 'declaration_required', message: 'You must accept the submission declaration.' }, { status: 400 });
  }
  if (!authorDetails.firstName || !authorDetails.lastName || !authorDetails.email) {
    return NextResponse.json({ error: 'missing_author_details' }, { status: 400 });
  }
  if (!wordFile) {
    return NextResponse.json({ error: 'missing_file', message: 'A manuscript file (.doc/.docx) is required.' }, { status: 400 });
  }
  if (wordFile.type && !WORD_TYPES.includes(wordFile.type) && !/\.docx?$/i.test(wordFile.name)) {
    return NextResponse.json({ error: 'invalid_file_type', message: 'Only Microsoft Word (.doc/.docx) files are accepted.' }, { status: 400 });
  }

  const buffer = Buffer.from(await wordFile.arrayBuffer());

  const submission = await createSubmission({
    userId: session.userId,
    title,
    description,
    language,
    theme: theme === 'Other' ? 'Other' : theme,
    themeOther: theme === 'Other' ? themeOther : undefined,
    authorSalutation: authorDetails.salutation,
    authorFirstName: authorDetails.firstName,
    authorLastName: authorDetails.lastName,
    authorEmail: authorDetails.email,
    authorPhone: authorDetails.phone,
    authorAffiliation: authorDetails.affiliation,
    authorDesignation: authorDetails.designation,
    authorCity: authorDetails.city,
    authorState: authorDetails.state,
    authorCountry: authorDetails.country || 'India',
    coAuthors
  });

  const wordPath = await uploadSubmissionFile(
    submission.id,
    1,
    'word',
    buffer,
    wordFile.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
  await createSubmissionVersion({ submissionId: submission.id, versionNumber: 1, wordPath, submittedBy: 'user' });
  await notifySubmissionReceived(submission);

  return NextResponse.json({ submission });
}
