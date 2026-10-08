import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listAllSubmissionsWithUser, listCoAuthors } from '@/lib/db/submissions';

function csvCell(value: unknown): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const submissions = await listAllSubmissionsWithUser();
  const headers = [
    'Article ID', 'Theme', 'Title', 'Primary Author', 'Co-Authors', 'Author Email', 'Author Phone',
    'Submission Date', 'Status', 'Acceptance Date', 'Publication Charge', 'Amount Paid', 'Balance',
    'Payment Status', 'Volume', 'Issue', 'Publication Status'
  ];

  const rows: string[][] = [];
  for (const s of submissions) {
    const coAuthors = await listCoAuthors(s.id);
    const coAuthorNames = coAuthors.map((c) => `${c.firstName} ${c.lastName}`).join('; ');
    const charge = s.publicationCharge || 0;
    rows.push([
      s.articleCode || '',
      s.theme === 'Other' ? s.themeOther || '' : s.theme || '',
      s.title,
      `${s.authorFirstName || ''} ${s.authorLastName || ''}`.trim(),
      coAuthorNames,
      s.authorEmail || s.userEmail,
      s.authorPhone || '',
      new Date(s.createdAt).toLocaleDateString(),
      s.status,
      s.status === 'accepted' || s.amountPaid > 0 ? new Date(s.updatedAt).toLocaleDateString() : '',
      String(charge),
      String(s.amountPaid),
      String(Math.max(0, charge - s.amountPaid)),
      s.status,
      s.volumeNumber ? String(s.volumeNumber) : '',
      s.issueNumber ? String(s.issueNumber) : '',
      s.status === 'published' ? 'Published' : ''
    ]);
  }

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="agrioxen-articles-${Date.now()}.csv"`
    }
  });
}
