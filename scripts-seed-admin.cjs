const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('node:crypto');
const prisma = new PrismaClient();
async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || !password || password.length < 12) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters).');
  const salt = randomBytes(16).toString('hex');
  const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  await prisma.user.upsert({ where: { email }, update: { passwordHash, role: 'ADMIN' }, create: { email, passwordHash, role: 'ADMIN', name: 'Administrator' } });
  console.log(`Admin account ready: ${email}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
