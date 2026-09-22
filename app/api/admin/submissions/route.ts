import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listAllSubmissionsWithUser } from '@/lib/db/submissions';
import type { SubmissionStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status') as SubmissionStatus | null;
  return NextResponse.json({ submissions: await listAllSubmissionsWithUser(status || undefined) });
}
