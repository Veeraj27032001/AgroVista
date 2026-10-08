import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listAllSupportRequestsWithUser } from '@/lib/db/support-requests';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ requests: await listAllSupportRequestsWithUser() });
}
