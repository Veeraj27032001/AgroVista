import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { createUser, findUserByEmail, listUsers, listUsersByRoles } from '@/lib/db/users';
import { notifyEditorAccountCreated } from '@/lib/staff-notifications';
import type { Role } from '@/lib/types';

const VALID_ROLES: Role[] = ['user', 'admin', 'editor', 'author'];

/** GET /api/admin/users?roles=user,editor — filters by role; omit for every user. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const rolesParam = req.nextUrl.searchParams.get('roles');
  if (!rolesParam) return NextResponse.json({ users: await listUsers() });

  const roles = rolesParam.split(',').filter((r): r is Role => VALID_ROLES.includes(r as Role));
  if (roles.length === 0) return NextResponse.json({ users: [] });
  return NextResponse.json({ users: await listUsersByRoles(roles) });
}

/** POST /api/admin/users  { name, email, password } — admin directly creates an Editor account (the only role this creates). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!name || !email || !password) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'weak_password', message: 'Password must be at least 8 characters.' }, { status: 400 });

  const existing = await findUserByEmail(email);
  if (existing) return NextResponse.json({ error: 'email_taken', message: 'A user with this email already exists.' }, { status: 400 });

  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash, role: 'editor' });
  await notifyEditorAccountCreated(email, name, password);

  return NextResponse.json({ user });
}
