import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateSubmissionStatus } from '@/lib/db/submissions';

/** POST /api/admin/submissions/[id]/review  { note } — sends a revision request. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const note = String(body.note || '').trim();
  if (!note) return NextResponse.json({ error: 'missing_note' }, { status: 400 });

  const submission = await updateSubmissionStatus(id, 'revision_requested', note);
  return NextResponse.json({ submission });
}
