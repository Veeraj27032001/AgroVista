import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getIssue, setIssueActive, setPrintStockSold, updateIssue } from '@/lib/db/catalog';
import { countPaidHardCopyPurchases } from '@/lib/db/orders';
import { uploadIssuePdf, uploadPoster } from '@/lib/storage';
import { autoDeliverToHardCopySubscribers } from '@/lib/subscription';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ issue });
}

/** PATCH /api/admin/issues/[id] — multipart, all fields optional; publishing (draft -> published) triggers auto-delivery. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = await getIssue(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const form = await req.formData();
  const patch: Parameters<typeof updateIssue>[1] = {};

  if (form.has('title')) patch.title = String(form.get('title'));
  if (form.has('description')) patch.description = String(form.get('description'));
  if (form.has('language')) patch.language = String(form.get('language'));
  if (form.has('categoryId')) patch.categoryId = String(form.get('categoryId')) || null;
  if (form.has('softCopyRate')) patch.softCopyRate = Number(form.get('softCopyRate'));
  if (form.has('hardCopyRate')) patch.hardCopyRate = Number(form.get('hardCopyRate'));
  if (form.has('bothRate')) patch.bothRate = Number(form.get('bothRate'));
  if (form.has('printStockTotal')) patch.printStockTotal = Number(form.get('printStockTotal'));
  if (form.has('couponApplicable')) patch.couponApplicable = form.get('couponApplicable') === 'true';
  if (form.has('status')) patch.status = form.get('status') === 'published' ? 'published' : 'draft';
  if (form.has('isSpecialEdition')) patch.isSpecialEdition = form.get('isSpecialEdition') === 'true';
  if (form.has('isActive')) patch.isActive = form.get('isActive') === 'true';

  const posterFile = form.get('poster') as File | null;
  if (posterFile && posterFile.size > 0) {
    patch.posterUrl = await uploadPoster(id, Buffer.from(await posterFile.arrayBuffer()), posterFile.type || 'image/jpeg');
  }
  const pdfFile = form.get('pdf') as File | null;
  if (pdfFile && pdfFile.size > 0) {
    patch.pdfStoragePath = await uploadIssuePdf(id, Buffer.from(await pdfFile.arrayBuffer()), pdfFile.type || 'application/pdf');
  }

  let updated = await updateIssue(id, patch);

  if (existing.status === 'draft' && updated.status === 'published') {
    await autoDeliverToHardCopySubscribers(updated);
  }

  // Reconcile the sold counter from real purchases whenever the stock total is (re)set —
  // handles turning on stock tracking for an issue that already has sales, with no drift risk.
  if (patch.printStockTotal !== undefined) {
    await setPrintStockSold(id, await countPaidHardCopyPurchases(id));
    updated = (await getIssue(id)) ?? updated;
  }

  return NextResponse.json({ issue: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await params;
  await setIssueActive(id, false);
  return NextResponse.json({ ok: true });
}
