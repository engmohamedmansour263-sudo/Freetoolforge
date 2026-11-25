import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export const SESSION_COOKIE = 'ftf_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({ data: { tokenHash: digest(token), userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', expires: expiresAt });
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: digest(token) }, include: { user: true } });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: digest(token) } });
  jar.delete(SESSION_COOKIE);
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'ADMIN' ? user : null;
}
