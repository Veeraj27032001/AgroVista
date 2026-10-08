import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSupportRequest, listSupportRequestsForUser, type SupportRequestType } from '@/lib/db/support-requests';
import { uploadSupportAttachment } from '@/lib/storage';

const ATTACHMENT_REQUIRED_TYPES: SupportRequestType[] = ['damaged', 'wrong_issue', 'missing_pages'];
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_MB = 5;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  const requests = await listSupportRequestsForUser(session.userId);
  return NextResponse.json({ requests });
}

/** POST /api/support-requests — multipart: type, legacyIssueOrderId?, subscriptionId?, description, photo0..photo2 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const form = await req.formData();
  const type = String(form.get('type') || '') as SupportRequestType;
  const legacyIssueOrderId = String(form.get('legacyIssueOrderId') || '') || undefined;
  const subscriptionId = String(form.get('subscriptionId') || '') || undefined;
  const description = String(form.get('description') || '').trim();

  if (!type) return NextResponse.json({ error: 'missing_type' }, { status: 400 });
  if (description.length < 20 || description.length > 2000) {
    return NextResponse.json({ error: 'invalid_description', message: 'Description must be 20–2000 characters.' }, { status: 400 });
  }

  const photos = [form.get('photo0'), form.get('photo1'), form.get('photo2')].filter((f): f is File => f instanceof File && f.size > 0);
  if (ATTACHMENT_REQUIRED_TYPES.includes(type) && photos.length === 0) {
    return NextResponse.json({ error: 'photo_required', message: 'At least one photo is required for this request type.' }, { status: 400 });
  }
  if (photos.length > MAX_ATTACHMENTS) {
    return NextResponse.json({ error: 'too_many_photos', message: `Up to ${MAX_ATTACHMENTS} photos allowed.` }, { status: 400 });
  }
  for (const photo of photos) {
    if (photo.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
      return NextResponse.json({ error: 'photo_too_large', message: `Each photo must be under ${MAX_ATTACHMENT_MB} MB.` }, { status: 400 });
    }
  }

  const request = await createSupportRequest({
    userId: session.userId,
    type,
    legacyIssueOrderId,
    subscriptionId,
    description
  });

  const attachmentKeys: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const path = await uploadSupportAttachment(request.id, i, Buffer.from(await photos[i].arrayBuffer()), photos[i].type || 'image/jpeg');
    attachmentKeys.push(path);
  }
  if (attachmentKeys.length > 0) {
    const { getSupabaseAdmin } = await import('@/lib/supabase');
    await getSupabaseAdmin().from('support_requests').update({ attachment_keys: attachmentKeys }).eq('id', request.id);
  }

  return NextResponse.json({ request: { ...request, attachmentKeys } });
}
