# Phase 14.7 — Factory Operations Dashboard

## Delivered

- Added an Arabic-first factory operations panel to `/admin`.
- Polls the existing admin jobs API every 10 seconds and supports status filtering.
- Shows the latest 100 jobs, status counts for the loaded result set, attempts, creation time, and last error.
- Allows administrators to enqueue a keyword job, run one queued job through the existing protected worker endpoint, cancel queued jobs, and retry failed/cancelled jobs.
- Added an admin-only job action endpoint with state checks and conditional updates to avoid cancelling a job after it has been claimed.
- Records administrative cancel/retry actions in the job log.

## API

`POST /api/admin/factory/jobs/:id/action` accepts `{ "action": "cancel" | "retry" }`.

- `cancel`: only transitions `QUEUED` jobs to `CANCELLED`.
- `retry`: only transitions `FAILED` or `CANCELLED` jobs to `QUEUED`, resets attempts and clears stale lease/error/output fields.

The dashboard's "run one job" action calls the existing `/api/admin/factory/worker` endpoint. Production parallelism should be provided by multiple separately supervised worker processes calling that endpoint with unique worker IDs or by deploying the queue processor as a dedicated worker service. The admin button is a manual one-job operation, not a persistent worker daemon.

## Safety and limitations

- All dashboard data and actions remain behind `requireAdmin()`.
- Job input is rendered as text; generated output is not executed in the browser.
- Successful factory candidates remain subject to human review; this dashboard does not publish tools.
- Counts represent the currently loaded (up to 100) jobs, not a database-wide aggregate.
- This phase does not add a live event stream, worker autoscaling, or a persistent worker supervisor.

## Verification

Run `npm install`, `npx prisma generate`, `npm run typecheck`, `npm test`, and `npm run build` in an environment with the project's dependencies and PostgreSQL configured. Database-backed concurrency and action-state behavior should also be exercised against PostgreSQL before production rollout.
