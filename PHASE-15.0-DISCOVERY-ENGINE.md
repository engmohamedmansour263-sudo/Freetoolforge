# Phase 15.0 — Autonomous Discovery Engine

## Scope delivered

- Added `OpportunityCandidate` persistence with a unique SHA-256 fingerprint, source, raw signals, transparent score analysis, lifecycle status, and optional factory job reference.
- Added a deterministic discovery analyzer that reuses the existing keyword-opportunity heuristic and safe tool blueprint registry.
- Added admin-only `POST /api/admin/discovery/candidates` for batches of up to 500 supplied search signals and `GET` for ranked candidate review.
- Optional queueing is explicitly opt-in (`queueQualified: true`), score-gated (default 70), processor-gated (only reviewed built-in processors), and capped (default 10 per request).
- Added unit tests for normalization/deduplication fingerprints, scoring, safe processor qualification, and invalid input.

## API example

```json
{
  "signals": [
    { "keyword": "json formatter", "impressions": 1200, "clicks": 5, "position": 8, "source": "search-console" }
  ],
  "queueQualified": false
}
```

To queue qualifying candidates, set `queueQualified` to `true`. The engine does not fetch search data itself and does not claim to estimate market demand. Signals must come from a connected source or an administrator. Unsupported ideas remain candidates for engineering review and are never executed as generated code.

## Migration and verification

Run `npx prisma migrate deploy` and `npx prisma generate` before application startup. Full typecheck, Vitest, build, and PostgreSQL integration tests require installing dependencies and configuring `DATABASE_URL`; they were not represented as passing in this delivery.

## Safety and limitations

- Admin authentication is required for both endpoints.
- Candidate deduplication is enforced by a database unique constraint.
- Queue insertion is not a single transaction with candidate status update; idempotency key `discovery:<candidateId>` makes retries safe against duplicate jobs.
- No external keyword provider is silently queried. A future Search Console connector can populate the same signal contract.
- Human approval remains required before publication.
