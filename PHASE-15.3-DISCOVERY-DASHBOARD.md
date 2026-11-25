# Phase 15.3 — Opportunity Intelligence Dashboard

## Delivered
- Embedded an Arabic-first opportunity dashboard in the existing admin control center.
- Displays candidate counts, top score, status filters, source, competition level, recommendation, and queue eligibility.
- Refreshes candidate and report data from the existing admin APIs.
- Adds an explicit per-candidate action to enqueue only `DISCOVERED` candidates whose stored analysis says `blueprintSupported`.
- Queue endpoint requires an admin session, validates stored signal data, uses a deterministic idempotency key (`discovery:<candidateId>`), and writes an audit event.
- Competitive-analysis candidates are normalized from their persisted signal metadata when queued.

## Safety and scope
- This dashboard does not publish tools. It only creates a factory job; the existing pipeline and human review remain in force.
- Competitor observations are still supplied by a trusted/manual SERP source. This phase does not scrape Google or invent competitor data.
- Scores are prioritization heuristics, not revenue forecasts.

## Verification
- ZIP integrity is checked after packaging.
- Full Next.js typecheck, build, Vitest, and PostgreSQL integration tests require installing dependencies and configuring a database; they are not claimed as passed in this environment.
