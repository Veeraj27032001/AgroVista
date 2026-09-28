import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { findUserById } from '@/lib/db/users';
import { getStateName, getDistrictName, getTalukName } from '@/lib/db/locations';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ authenticated: false });

  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ authenticated: false });

  const [stateName, districtName, talukName] = await Promise.all([
    user.stateId ? getStateName(user.stateId) : Promise.resolve(null),
    user.districtId ? getDistrictName(user.districtId) : Promise.resolve(null),
    user.talukId ? getTalukName(user.talukId) : Promise.resolve(null)
  ]);

  return NextResponse.json({ authenticated: true, user: { ...user, stateName, districtName, talukName } });
}
