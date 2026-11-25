import { randomUUID } from 'node:crypto';
import { processNextFactoryJob } from '../lib/jobs/generation-queue';
import { prisma } from '../lib/db';

const concurrency = Math.min(16, Math.max(1, Number.parseInt(process.env.FACTORY_WORKER_CONCURRENCY ?? '2', 10) || 2));
const pollMs = Math.min(30_000, Math.max(250, Number.parseInt(process.env.FACTORY_WORKER_POLL_MS ?? '2000', 10) || 2000));
const prefix = (process.env.FACTORY_WORKER_ID ?? 'factory-worker').slice(0, 60);
let stopping = false;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function worker(slot: number) {
  const id = `${prefix}-${slot}-${randomUUID().slice(0, 8)}`;
  while (!stopping) {
    try {
      const result = await processNextFactoryJob(id);
      if (!result.processed) await sleep(pollMs);
      else process.stdout.write(`[${id}] processed ${result.jobId}${'error' in result ? ` error=${result.error}` : ''}\n`);
    } catch (error) {
      process.stderr.write(`[${id}] worker error: ${error instanceof Error ? error.message : String(error)}\n`);
      await sleep(Math.min(10_000, pollMs * 2));
    }
  }
}

async function main() {
  process.stdout.write(`Starting ${concurrency} FreeToolForge workers; poll=${pollMs}ms\n`);
  const workers = Array.from({ length: concurrency }, (_, index) => worker(index + 1));
  await Promise.all(workers);
  await prisma.$disconnect();
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => { stopping = true; process.stdout.write(`Received ${signal}; draining workers...\n`); });
}

main().catch(async (error) => {
  process.stderr.write(`Fatal worker error: ${error instanceof Error ? error.stack : String(error)}\n`);
  await prisma.$disconnect();
  process.exitCode = 1;
});
