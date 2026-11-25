# Phase 15.1 — Search Console sync

## Implemented

- Search Analytics query pagination in 25,000-row pages, bounded to 100,000 rows per run.
- 30-second timeout per Google API request.
- Admin import now processes every fetched row server-side in database batches of 500 and persists the resulting opportunities, rather than putting only the first 500 rows in a textarea for a manual second action.
- Added `POST /api/admin/seo-autopilot/search-console/import` for the one-step admin import.
- Added `POST /api/cron/search-console-sync`, protected by `Authorization: Bearer $CRON_SECRET` (or `x-cron-secret`). It fetches the same delayed 28-day window, evaluates rows, and upserts opportunities without creating factory jobs or publishing tools.
- Scheduled sync writes an audit log entry and keeps already published/candidate-created opportunity statuses intact.

## Schedule

Configure the hosting platform's scheduler to POST `/api/cron/search-console-sync` once per day and send `Authorization: Bearer <CRON_SECRET>`. This repository exposes the protected endpoint; it does not itself provision a hosting cron schedule. Run after Search Console's reporting delay, preferably once daily.

## Google setup

Use the service-account steps in `GOOGLE-SEARCH-CONSOLE-SETUP.md`. Grant the service-account email access to the exact property. Keep all credentials server-side; never use `NEXT_PUBLIC_` variables.

## Boundaries

- Google Search Console is read-only.
- Google may omit anonymized or low-volume queries and may return fewer rows than expected.
- Each run is capped at 100,000 query rows to bound runtime and database work.
- Scheduled sync discovers and scores opportunities only. It does not enqueue factory jobs, create tools, or publish content.
- The daily scheduler must be configured in the deployment environment; adding this route alone does not create a schedule.
