# Phase 14.8 — Worker Runtime and Operations Metrics

## Delivered
- Added a long-running Node worker entrypoint (`npm run worker:factory`).
- Supports configurable concurrency (1–16 workers per process) and idle polling.
- Each worker has a unique ID; job claiming continues to use PostgreSQL `FOR UPDATE SKIP LOCKED`.
- Handles SIGINT/SIGTERM by stopping new claims and draining current calls.
- Added admin-only `GET /api/admin/factory/metrics` with queue counts, recently-heartbeating active worker count, and daily success/failure totals.
- Added a Docker Compose `factory-worker` service with restart policy and graceful-stop window.

## Configuration
- `FACTORY_WORKER_ID`: worker ID prefix.
- `FACTORY_WORKER_CONCURRENCY`: worker loops per process (default 2, max 16).
- `FACTORY_WORKER_POLL_MS`: idle poll delay (default 2000 ms, min 250 ms).

## Run
```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run worker:factory
```
Or run `docker compose up -d --build` to start web, database and worker services.

## Operational notes and limitations
- Run workers only after database migrations have been applied.
- The queue lease is currently 60 seconds. The current autonomous pipeline is synchronous; if future pipeline stages perform long network calls or run longer than the lease, convert them to async and periodically call `heartbeatFactoryJob` while the lease owner is still valid.
- The metrics endpoint reports distinct worker IDs on RUNNING jobs with a recent heartbeat; it is an activity estimate, not a process registry. Idle workers are intentionally not counted.
- Concurrency is configured per worker process. Scale horizontally by running additional worker containers; ensure PostgreSQL connection capacity is sized accordingly.
- Job execution remains constrained to the registered tool pipeline and human review. No generated source is dynamically executed or auto-published.
