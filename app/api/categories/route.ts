import { NextResponse } from 'next/server';
import { listCategories } from '@/lib/db/categories';

export async function GET() {
  return NextResponse.json({ categories: await listCategories() });
}
