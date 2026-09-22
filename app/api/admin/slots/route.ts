import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSlot, listSlotsForVolume } from '@/lib/db/catalog';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const volumeId = req.nextUrl.searchParams.get('volumeId');
  if (!volumeId) return NextResponse.json({ error: 'missing_volume_id' }, { status: 400 });
  return NextResponse.json({ slots: await listSlotsForVolume(volumeId) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { volumeId, slotNumber, month, issueType } = body;
  if (!volumeId || !slotNumber) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const slot = await createSlot({ volumeId, slotNumber, month, issueType });
  return NextResponse.json({ slot });
}
