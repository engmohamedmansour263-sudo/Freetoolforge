import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db';
import type { KeywordSignal } from '@/lib/seo/tool-autopilot';

export type FactoryJobInput = KeywordSignal;
const LEASE_MS = Math.max(30_000, Number.parseInt(process.env.FACTORY_WORKER_LEASE_MS ?? '60000', 10) || 60_000);
const HEARTBEAT_MS = Math.max(5_000, Math.min(LEASE_MS / 2, Number.parseInt(process.env.FACTORY_WORKER_HEARTBEAT_MS ?? '15000', 10) || 15_000));

export function getFactoryRetryDelay(attempt: number) {
  return Math.min(300_000, 2 ** Math.max(1, attempt) * 1_000);
}

export async function enqueueFactoryJob(input: FactoryJobInput, idempotencyKey?: string) {
  if (idempotencyKey) {
    const existing = await prisma.generationJob.findUnique({ where: { idempotencyKey } });
    if (existing) return { job: existing, created: false };
  }
  try {
    const job = await prisma.generationJob.create({ data: {
      type: 'AUTONOMOUS_FACTORY', input: JSON.parse(JSON.stringify(input)),
      ...(idempotencyKey ? { idempotencyKey } : {}),
      logs: { create: { level: 'INFO', message: 'Job queued for autonomous factory processing.' } },
    } });
    return { job, created: true };
  } catch (error) {
    if (idempotencyKey) {
      const existing = await prisma.generationJob.findUnique({ where: { idempotencyKey } });
      if (existing) return { job: existing, created: false };
    }
    throw error;
  }
}

/** Atomically claims one job. SKIP LOCKED permits multiple workers without duplicate claims. */
export async function claimFactoryJob(workerId = `worker-${randomUUID()}`) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `UPDATE \"GenerationJob\" SET \"status\"='FAILED', \"error\"='Worker lease expired after maximum attempts', \"completedAt\"=NOW(), \"lockedAt\"=NULL, \"lockedBy\"=NULL, \"leaseExpiresAt\"=NULL, \"updatedAt\"=NOW() WHERE \"type\"='AUTONOMOUS_FACTORY' AND \"status\"='RUNNING' AND \"leaseExpiresAt\" < NOW() AND \"attempts\" >= \"maxAttempts\"`
    );
    const rows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "GenerationJob"
       WHERE "type" = 'AUTONOMOUS_FACTORY' AND "scheduledAt" <= NOW()
         AND "attempts" < "maxAttempts"
         AND ("status" = 'QUEUED' OR ("status" = 'RUNNING' AND "leaseExpiresAt" < NOW()))
       ORDER BY "createdAt" ASC FOR UPDATE SKIP LOCKED LIMIT 1`
    );
    if (!rows.length) return null;
    const id = rows[0].id;
    await tx.$executeRawUnsafe(
      `UPDATE "GenerationJob" SET "status"='RUNNING', "attempts"="attempts"+1,
       "lockedAt"=NOW(), "lockedBy"=$1, "heartbeatAt"=NOW(),
       "leaseExpiresAt"=NOW() + ($2 * INTERVAL '1 millisecond'), "error"=NULL,
       "updatedAt"=NOW() WHERE "id"=$3`, workerId, LEASE_MS, id
    );
    await tx.generationJobLog.create({ data: { jobId: id, level: 'INFO', message: `Claimed by ${workerId}.` } });
    return tx.generationJob.findUnique({ where: { id } });
  });
}

export async function heartbeatFactoryJob(jobId: string, workerId: string) {
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "GenerationJob" SET "heartbeatAt"=NOW(), "leaseExpiresAt"=NOW() + ($1 * INTERVAL '1 millisecond'), "updatedAt"=NOW()
     WHERE "id"=$2 AND "status"='RUNNING' AND "lockedBy"=$3`, LEASE_MS, jobId, workerId
  );
  return result === 1;
}

export async function processNextFactoryJob(workerId = `worker-${randomUUID()}`) {
  const job = await claimFactoryJob(workerId);
  if (!job) return { processed: false as const };
  let leaseLost = false;
  const heartbeat = setInterval(() => {
    void heartbeatFactoryJob(job.id, workerId).then((ok) => { if (!ok) leaseLost = true; }).catch(() => { leaseLost = true; });
  }, HEARTBEAT_MS);
  heartbeat.unref?.();
  try {
    const { runAutonomousFactoryPipeline } = await import('@/lib/seo/autonomous-factory-pipeline');
    const input = job.input as unknown as FactoryJobInput;
    const output = await Promise.resolve(runAutonomousFactoryPipeline(input));
    clearInterval(heartbeat);
    if (leaseLost) throw new Error('Worker lease was lost before completion; result was not committed.');
    const serialized = JSON.parse(JSON.stringify(output));
    const committed = await prisma.generationJob.updateMany({
      where: { id: job.id, status: 'RUNNING', lockedBy: workerId },
      data: { status: 'SUCCEEDED', output: serialized, completedAt: new Date(), lockedAt: null, lockedBy: null, leaseExpiresAt: null, heartbeatAt: null },
    });
    if (committed.count !== 1) throw new Error('Job lease ownership changed; refusing stale completion.');
    for (const stage of output.stages) {
      await prisma.generationJobLog.create({ data: { jobId: job.id, level: stage.status === 'failed' ? 'WARN' : 'INFO', message: `[${stage.id}] ${stage.status}: ${stage.detail}` } });
    }
    await prisma.generationJobLog.create({ data: { jobId: job.id, level: output.accepted ? 'INFO' : 'WARN', message: output.accepted ? 'Pipeline completed; candidate awaits human review.' : `Pipeline rejected: ${output.reason ?? 'quality or safety gate failed'}` } });
    return { processed: true as const, jobId: job.id, output };
  } catch (error) {
    clearInterval(heartbeat);
    const message = error instanceof Error ? error.message.slice(0, 1000) : 'Unknown worker error';
    const latest = await prisma.generationJob.findUnique({ where: { id: job.id }, select: { attempts: true, maxAttempts: true } });
    const terminal = !latest || latest.attempts >= latest.maxAttempts;
    const changed = await prisma.generationJob.updateMany({
      where: { id: job.id, status: 'RUNNING', lockedBy: workerId },
      data: { status: terminal ? 'FAILED' : 'QUEUED', error: message, scheduledAt: new Date(Date.now() + getFactoryRetryDelay(latest?.attempts ?? 1)), lockedAt: null, lockedBy: null, leaseExpiresAt: null, heartbeatAt: null, ...(terminal ? { completedAt: new Date() } : {}) },
    });
    if (changed.count === 1) await prisma.generationJobLog.create({ data: { jobId: job.id, level: 'ERROR', message: `Attempt failed: ${message}` } });
    return { processed: true as const, jobId: job.id, error: message, retrying: changed.count === 1 && !terminal };
  }
}
