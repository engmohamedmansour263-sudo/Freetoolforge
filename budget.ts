import { prisma } from '@/lib/db';

function startOfDay() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function startOfMonth() { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }
export async function getSpend() {
  const [day, month] = await Promise.all([
    prisma.aIUsage.aggregate({ where: { date: { gte: startOfDay() } }, _sum: { estimatedCost: true } }),
    prisma.aIUsage.aggregate({ where: { date: { gte: startOfMonth() } }, _sum: { estimatedCost: true } }),
  ]);
  return { dailyUsd: day._sum.estimatedCost ?? 0, monthlyUsd: month._sum.estimatedCost ?? 0 };
}
export async function assertWithinBudget() {
  const spend = await getSpend();
  const dailyLimit = Number(process.env.AI_DAILY_BUDGET_USD || 0);
  const monthlyLimit = Number(process.env.AI_MONTHLY_BUDGET_USD || 0);
  if (dailyLimit > 0 && spend.dailyUsd >= dailyLimit) throw new Error('AI daily budget reached');
  if (monthlyLimit > 0 && spend.monthlyUsd >= monthlyLimit) throw new Error('AI monthly budget reached');
  return spend;
}
