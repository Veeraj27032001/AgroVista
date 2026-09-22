import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSubmissionVersion, nextVersionNumber } from '@/lib/db/submissions';
import { uploadAdminEditFile } from '@/lib/storage';

/** POST /api/admin/submissions/[id]/upload-edit — multipart: word, pdf. Admin-only edited copy. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const form = await req.formData();
  const wordFile = form.get('word') as File | null;
  const pdfFile = form.get('pdf') as File | null;
  if (!wordFile || !pdfFile) {
    return NextResponse.json({ error: 'missing_files', message: 'Both a Word file and a PDF file are required.' }, { status: 400 });
  }

  const versionNumber = await nextVersionNumber(id);
  const wordPath = await uploadAdminEditFile(
    id,
    'word',
    Buffer.from(await wordFile.arrayBuffer()),
    wordFile.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
  const pdfPath = await uploadAdminEditFile(id, 'pdf', Buffer.from(await pdfFile.arrayBuffer()), pdfFile.type || 'application/pdf');

  const version = await createSubmissionVersion({
    submissionId: id,
    versionNumber,
    wordPath,
    pdfPath,
    submittedBy: 'admin',
    isAdminEdit: true
  });

  return NextResponse.json({ version });
}
