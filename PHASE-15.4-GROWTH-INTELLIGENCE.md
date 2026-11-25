# Phase 15.4 — Growth Intelligence & Tool Optimization

## Delivered
- Added a pure performance analyzer based only on observed first-party `AnalyticsEvent` rows.
- Added `GET /api/admin/growth/insights?days=30` (admin protected; days clamped to 7–90).
- Added an admin panel listing published tools, observed view/run counts, observed run-to-view ratio, bounded priority, and conservative recommendations.
- Added unit tests for low conversion, insufficient data, and priority bounds.

## Event interpretation
- View count increments for event names containing `view` or `page` (case-insensitive).
- Run count increments for event names containing `run`, `execute`, or `submit`.
- The API does not invent impressions, search rankings, revenue, or conversion attribution. It reports the inferred event count and warns that absent instrumentation yields insufficient data.

## Safety and limitations
- Recommendations are advisory only. No tool manifest, SEO metadata, or published content is modified.
- No automatic publication or external SERP scraping was added.
- Existing AnalyticsEvent schema has no explicit event taxonomy or session attribution; counts are therefore directional, not a statistically validated conversion funnel.
- Full build/database integration tests require installed dependencies and a configured PostgreSQL database.
