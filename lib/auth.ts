import 'server-only';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { config } from './config';
import type { Role, SessionUser } from './types';

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(user: SessionUser): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: `${config.jwtExpiryDays}d` });
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    if (!payload.userId || !payload.email || !payload.role) return null;
    return { userId: payload.userId as string, email: payload.email as string, role: payload.role as Role };
  } catch {
    return null;
  }
}

/** Reads and verifies the session cookie for the current request. */
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(config.sessionCookieName)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function signPasswordResetToken(userId: string): string {
  return jwt.sign({ userId, type: 'password_reset' }, config.jwtSecret, { expiresIn: '30m' });
}

export function verifyPasswordResetToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    if (payload.type !== 'password_reset' || !payload.userId) return null;
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}

export const OTP_COOKIE_NAME = 'agrovista_otp';

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function signOtpToken(userId: string, code: string): string {
  return jwt.sign({ userId, code, type: 'otp' }, config.jwtSecret, { expiresIn: '10m' });
}

export function verifyOtpToken(token: string): { userId: string; code: string } | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    if (payload.type !== 'otp' || !payload.userId || !payload.code) return null;
    return { userId: payload.userId as string, code: payload.code as string };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_MAX_AGE_SECONDS = config.jwtExpiryDays * 24 * 60 * 60;

/** For Server Components: redirects to /login (or /admin login-gate) if the check fails. */
export async function requireUserOrRedirect(): Promise<SessionUser> {
  const { redirect } = await import('next/navigation');
  const session = await getSession();
  if (!session) redirect('/login');
  return session as SessionUser;
}

export async function requireAdminOrRedirect(): Promise<SessionUser> {
  const { redirect } = await import('next/navigation');
  const session = await getSession();
  if (!session) redirect('/login?redirect=/admin');
  if (session!.role !== 'admin') redirect('/unauthorized');
  return session as SessionUser;
}
