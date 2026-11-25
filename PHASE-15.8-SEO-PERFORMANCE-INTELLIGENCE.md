# Phase 15.8 — SEO Performance Intelligence

## Delivered
- Added `GET /api/admin/seo-intelligence` for authenticated administrators. It reads the latest persisted `SEOKeywordOpportunity` rows, classifies them, summarizes impressions/clicks, and optionally matches `suggestedSlug` to published tools.
- Added `POST /api/admin/seo-intelligence` to fetch the existing complete 28-day Search Console query window, persist rows through the existing keyword-import pipeline, and write an audit event.
- Added deterministic opportunity classification: low CTR (minimum 100 impressions, position 3–20, CTR below 3%), striking distance (minimum 50 impressions, position above 8 through 20), high visibility (minimum 100 impressions, position at most 8), otherwise low data.
- Added unit tests for classification, sparse/invalid data handling, aggregation, and ordering.

## Data integrity and limits
- No Google metrics are fabricated. The GET endpoint reports stored data and identifies its source; POST requires configured Search Console credentials.
- Keyword-to-tool matching uses `suggestedSlug` only and is not proof that the page ranks for that query.
- Search Console rows are aggregated query signals for the configured property/window; they do not provide per-tool page attribution in this implementation.
- The classification thresholds are heuristic triage signals, not causal conclusions or guarantees of ranking improvement.

## Verification
- Run `npm test -- tests/seo-performance-intelligence.test.ts` and `npm run typecheck` in an environment with dependencies installed.
- End-to-end sync requires valid Google Search Console service-account credentials and property access.
