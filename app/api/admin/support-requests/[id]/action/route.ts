import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { actionSupportRequest, getSupportRequest, type SupportRequestStatus, type SupportResolution } from '@/lib/db/support-requests';

/** POST /api/admin/support-requests/[id]/action  { status, resolution?, resolutionNote? } */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = await getSupportRequest(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const status = body.status as SupportRequestStatus;
  const resolution = body.resolution as SupportResolution | undefined;
  const resolutionNote = body.resolutionNote as string | undefined;

  if (!status) return NextResponse.json({ error: 'missing_status' }, { status: 400 });
  if (status === 'rejected' && !resolutionNote?.trim()) {
    return NextResponse.json({ error: 'missing_reason', message: 'A reason is required to reject.' }, { status: 400 });
  }

  const request = await actionSupportRequest(id, { status, resolution, resolutionNote, handledBy: session.userId });
  return NextResponse.json({ request });
}
