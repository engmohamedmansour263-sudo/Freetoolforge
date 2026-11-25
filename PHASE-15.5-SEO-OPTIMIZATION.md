# Phase 15.5 — SEO Optimization Engine

## Scope
This phase adds deterministic on-page metadata diagnostics and reviewable metadata proposals for already-published tools. It does not crawl Google, estimate rankings, predict revenue, or automatically edit published pages.

## Admin APIs
- `GET /api/admin/seo-optimization`: returns up to 200 published tools with metadata diagnostics and a bounded score.
- `POST /api/admin/seo-optimization/drafts` with `{ "toolId": "..." }`: creates a `PENDING_REVIEW` proposal.
- `PATCH /api/admin/seo-optimization/drafts/:id` with `{ "decision": "APPROVE" | "REJECT", "notes": "..." }`: records the review decision.

Approval is deliberately not application. A later phase must implement version-aware application, snapshot the prior manifest, run validation, and provide rollback before any approved change can affect a published page.

## Migration
Run `npx prisma migrate deploy` and `npx prisma generate` after installing dependencies.

## Verification limitations
Unit tests were added, but the full suite, Prisma migration against PostgreSQL, and production build require project dependencies and a configured database. They have not been represented as passing.
