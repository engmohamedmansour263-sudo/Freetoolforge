# Phase 14.9 — Worker Reliability

## Changes
- Configurable worker lease and heartbeat intervals.
- Workers renew their lease while a job is being processed.
- Completion and failure updates are fenced by `status=RUNNING` and `lockedBy=workerId`; stale workers cannot overwrite a newer claim.
- Stage-level pipeline outcomes are persisted to `GenerationJobLog`.
- Exponential retry delay is centralized and capped at five minutes.
- Admin-only `GET /api/admin/factory/health` reports stale running jobs, due/delayed queue depth, and expired leases.

## Configuration
- `FACTORY_WORKER_LEASE_MS` (default 60000; minimum 30000)
- `FACTORY_WORKER_HEARTBEAT_MS` (default 15000; clamped below half the lease)

## Operational caveat
The current autonomous pipeline is synchronous and short-running. Node timers cannot execute while CPU-bound synchronous JavaScript blocks the event loop. Heartbeats are therefore effective for asynchronous pipeline work and future long-running stages, but not a substitute for splitting CPU-bound work into yieldable chunks or separate processes. Lease fencing protects database writes if a worker loses ownership.

## Verification
ZIP integrity can be checked with `unzip -t`. Full build, Prisma validation, and PostgreSQL integration tests require installed dependencies and a configured PostgreSQL database; they must be run in the deployment environment.
