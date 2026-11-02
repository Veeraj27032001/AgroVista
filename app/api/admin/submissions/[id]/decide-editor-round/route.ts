import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { decideEditorRound, getActiveEditorRound } from '@/lib/db/submission-editor-rounds';
import { createMessage } from '@/lib/db/article-messages';

/** POST /api/admin/submissions/[id]/decide-editor-round  { decision: 'accepted'|'cancelled' } — admin decides on the round the editor forwarded back. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const activeRound = await getActiveEditorRound(id);
  if (!activeRound) return NextResponse.json({ error: 'no_active_round' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const decision = body.decision === 'accepted' ? 'accepted' : body.decision === 'cancelled' ? 'cancelled' : null;
  if (!decision) return NextResponse.json({ error: 'invalid_decision' }, { status: 400 });
  if (decision === 'accepted' && !activeRound.hasAttachment) {
    return NextResponse.json({ error: 'no_attachment', message: 'This round has no attached file — it can only be cancelled.' }, { status: 400 });
  }
  if (decision === 'accepted' && !activeRound.forwardedAt) {
    return NextResponse.json({ error: 'not_forwarded', message: 'The editor has not forwarded this round back yet.' }, { status: 400 });
  }

  const round = await decideEditorRound(activeRound.id, id, decision, session.userId);
  await createMessage(id, 'admin', decision === 'accepted' ? "Accepted the editor's forwarded copy." : 'Cancelled this editor round.');

  return NextResponse.json({ round });
}
