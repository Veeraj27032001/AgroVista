import { NextRequest, NextResponse } from 'next/server';
import { listPublishedIssues } from '@/lib/db/catalog';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const year = params.get('year') ? parseInt(params.get('year')!, 10) : undefined;
  const volumeId = params.get('volumeId') || undefined;
  const language = params.get('language') || undefined;
  const search = params.get('search') || undefined;
  const page = params.get('page') ? parseInt(params.get('page')!, 10) : undefined;
  const specialEditionsOnly = params.get('specialEditions') === 'true' ? true : undefined;

  const { issues, total } = await listPublishedIssues({ year, volumeId, language, search, page, specialEditionsOnly });
  return NextResponse.json({ issues, total });
}
