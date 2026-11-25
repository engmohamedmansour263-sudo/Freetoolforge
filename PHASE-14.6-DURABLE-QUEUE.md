# Phase 14.6 — Durable Factory Job Queue

## Delivered
- PostgreSQL-backed factory jobs using the existing `GenerationJob` and `GenerationJobLog` tables.
- Idempotent enqueue support through an optional unique `idempotencyKey`.
- Atomic job claiming with `FOR UPDATE SKIP LOCKED`, leases, heartbeat timestamps, and worker identity.
- Expired leases can be reclaimed; jobs that exhaust their attempt budget are marked failed.
- Exponential retry scheduling for worker exceptions, with a five-attempt default.
- Admin APIs to enqueue/list jobs and to process one queued job per worker invocation.
- Optional `FACTORY_WORKER_SECRET` bearer authentication for an external scheduler.

## API
- `POST /api/admin/factory/jobs`: enqueue a factory job. Body includes `keyword`, optional search metrics, and optional `idempotencyKey`.
- `GET /api/admin/factory/jobs?take=30&status=QUEUED`: list jobs and recent logs.
- `POST /api/admin/factory/worker`: process one job. Requires an admin session or `Authorization: Bearer $FACTORY_WORKER_SECRET`.

## Deployment
1. Apply migrations: `npx prisma migrate deploy`.
2. Regenerate Prisma client: `npx prisma generate`.
3. Configure `FACTORY_WORKER_SECRET` if calling from an external scheduler.
4. Invoke the worker endpoint periodically (for example, every minute). Each call handles at most one job; parallel invocations are safe due to row locking and leases.

## Safety and limitations
- The worker calls the existing deterministic, reviewed-processor pipeline. It does not execute generated code and does not publish tools.
- A job's `SUCCEEDED` status means the pipeline finished; the output may still be a rejected candidate and always remains subject to human review.
- Heartbeat/lease fields support recovery. The current pipeline is synchronous and short; a future long-running AI workflow should heartbeat during each stage.
- Idempotency is guaranteed only when the caller supplies a stable idempotency key.
- Queue processing requires PostgreSQL and the migration above. Database execution was not possible in this build environment.
