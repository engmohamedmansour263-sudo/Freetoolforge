# Phase 15.7 — SEO Experiments & Safe Rollback

## Admin endpoint
`GET /api/admin/seo-optimization/experiments/:toolId`

Returns the latest 20 version records and descriptive 7/28-day comparisons around the newest version timestamp. The comparison uses existing first-party `AnalyticsEvent` rows for the tool slug. Events whose names contain `view`/`page` count as views; `run`/`execute`/`submit` count as runs. A window is reported as `WAITING_FOR_WINDOW` until its full post-version period has elapsed, or `INSUFFICIENT_DATA` when events are absent. It never labels a change successful based on missing data. A measured run-rate change is descriptive and is not causal proof of SEO impact.

## Rollback
`POST /api/admin/seo-optimization/experiments/:toolId`

Body: `{ "targetVersion": 2, "expectedCurrentVersion": 4 }`.

Only published tools can be rolled back. The target must be an existing older version and the expected version must still be current. A serializable transaction copies the target manifest into a *new* monotonically increasing ToolVersion and updates the live manifest. Historical versions remain immutable; publication status and `indexable` are preserved. The action is audited as `SEO_VERSION_ROLLBACK`.

## Limits
This phase uses first-party product analytics only. Search Console query metrics are not joined to a specific tool/version in the existing schema, so no Search Console attribution or ranking claim is made. Full build/database integration tests require installed dependencies and a configured PostgreSQL database.
