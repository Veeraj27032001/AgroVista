import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateUserProfile } from '@/lib/db/users';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, phone, address, city, state, pincode } = body;

  const user = await updateUserProfile(session.userId, { name, phone, address, city, state, pincode });
  return NextResponse.json({ user });
}
