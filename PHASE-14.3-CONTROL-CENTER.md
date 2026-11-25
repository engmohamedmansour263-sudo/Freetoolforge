# Phase 14.3 — AI Control Center foundations

Implemented foundations (server-side):
- `GET /api/admin/ai/overview` (admin-only) reports configured providers (no secrets), spend, budget limits, circuit snapshot, recent requests, and recent provider health.
- Daily/monthly budget guard via `AI_DAILY_BUDGET_USD` and `AI_MONTHLY_BUDGET_USD`; zero means unlimited. The guard reads recorded AIUsage estimates before each call. Concurrent calls may overshoot; this is not a hard transactional reservation.
- Process-local circuit breaker: `AI_CIRCUIT_FAILURE_THRESHOLD` (default 3), `AI_CIRCUIT_OPEN_MS` (default 60s), excludes open providers; a provider can be retried after the cool-off.
- Request, usage and provider-health persistence is best-effort and cannot fail a successful generation.
- Optional generic token pricing estimates using `AI_COST_PER_1K_INPUT_USD` and `AI_COST_PER_1K_OUTPUT_USD`; set to zero unless values match the deployed model pricing. Actual model-specific price registry remains future work.

Limitations: circuit state is process-local (not shared across serverless instances); budgets are estimate-based and not atomic; no UI dashboard yet; requires database/dependencies and configured secrets for live verification.
