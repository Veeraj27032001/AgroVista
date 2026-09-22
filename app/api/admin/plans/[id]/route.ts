import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deletePlan, updatePlan } from '@/lib/db/subscriptions';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const plan = await updatePlan(id, body);
  return NextResponse.json({ plan });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  await deletePlan(id);
  return NextResponse.json({ ok: true });
}
