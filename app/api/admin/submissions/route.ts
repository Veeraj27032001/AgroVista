import { NextRequest, NextResponse } from 'next/server';
import { getSession, isStaffRole } from '@/lib/auth';
import { listAllSubmissionsWithUser } from '@/lib/db/submissions';
import type { SubmissionStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isStaffRole(session.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status') as SubmissionStatus | null;
  // Editors only see what's been forwarded to them — admin sees everything.
  const assignedEditorId = session.role === 'editor' ? session.userId : undefined;
  return NextResponse.json({ submissions: await listAllSubmissionsWithUser(status || undefined, assignedEditorId) });
}
