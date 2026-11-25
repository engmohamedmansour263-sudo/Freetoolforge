import { prisma } from '@/lib/db';
import { plans, type PlanId } from '@/lib/monetization/plans';

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function planCredits(planId: PlanId) {
  return plans[planId].monthlyCredits;
}

/**
 * Ensures a current monthly account exists. Billing integrations must update planId
 * only after a verified provider webhook; this module never trusts client plan claims.
 */
export async function getOrCreateCreditAccount(userId: string) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const current = await tx.creditAccount.findUnique({ where: { userId } });
    if (!current) {
      return tx.creditAccount.create({
        data: {
          userId, planId: 'free', periodStart: now,
          periodEnd: new Date(now.getTime() + MONTH_MS), monthlyCredits: planCredits('free'),
        },
      });
    }
    if (current.periodEnd <= now) {
      return tx.creditAccount.update({
        where: { userId },
        data: {
          periodStart: now, periodEnd: new Date(now.getTime() + MONTH_MS),
          usedCredits: 0, monthlyCredits: planCredits(current.planId as PlanId),
        },
      });
    }
    return current;
  });
}

/** Atomically records a usage charge once. Replays with the same key never double-charge. */
export async function consumeCredits(userId: string, amount: number, idempotencyKey: string) {
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100_000) {
    return { ok: false as const, code: 'INVALID_AMOUNT' as const };
  }
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
    return { ok: false as const, code: 'INVALID_IDEMPOTENCY_KEY' as const };
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const account = await tx.creditAccount.findUnique({ where: { userId } });
      if (!account) return { ok: false as const, code: 'ACCOUNT_NOT_FOUND' as const };
      const previous = await tx.creditLedger.findUnique({ where: { idempotencyKey } });
      if (previous) {
        if (previous.userId !== userId || previous.amount !== -amount) {
          return { ok: false as const, code: 'IDEMPOTENCY_CONFLICT' as const };
        }
        return { ok: true as const, duplicate: true, usedCredits: account.usedCredits };
      }
      const unlimited = account.monthlyCredits === -1;
      const updated = unlimited
        ? await tx.creditAccount.update({ where: { userId }, data: { usedCredits: { increment: amount } } })
        : await tx.creditAccount.updateMany({
            where: { userId, usedCredits: { lte: account.monthlyCredits - amount } },
            data: { usedCredits: { increment: amount } },
          });
      if (!unlimited && updated.count !== 1) return { ok: false as const, code: 'INSUFFICIENT_CREDITS' as const };
      const fresh = unlimited ? updated : await tx.creditAccount.findUniqueOrThrow({ where: { userId } });
      await tx.creditLedger.create({
        data: { userId, amount: -amount, reason: 'tool_usage', idempotencyKey },
      });
      return { ok: true as const, duplicate: false, usedCredits: fresh.usedCredits };
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    // Unique-key races are safe to retry with the same idempotency key.
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const existing = await prisma.creditLedger.findUnique({ where: { idempotencyKey } });
      if (existing?.userId === userId && existing.amount === -amount) {
        const account = await prisma.creditAccount.findUnique({ where: { userId } });
        return { ok: true as const, duplicate: true, usedCredits: account?.usedCredits ?? 0 };
      }
      return { ok: false as const, code: 'IDEMPOTENCY_CONFLICT' as const };
    }
    throw error;
  }
}
