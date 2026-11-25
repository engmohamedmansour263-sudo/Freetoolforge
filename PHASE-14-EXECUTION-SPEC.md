# FreeToolForge 2.0 — Phase 14.0 and 14.1 Execution Specification

**Target:** Stabilize the Phase 13 application, then establish a provider-neutral AI orchestration layer without enabling arbitrary generated-code execution.

## Guiding decisions

1. Preserve the Phase 13 public runtime and reviewed processor registry.
2. Keep the existing admin review gate. AI-generated candidates remain non-indexable and unpublished until explicit approval.
3. Do not store API secrets in Prisma JSON, manifests, job inputs, logs, or client-visible responses.
4. Provider selection must be deterministic, observable, bounded, and testable.
5. A provider failure may trigger a fallback only when the failure is classified as retryable and the task budget permits it.
6. No arbitrary generated source is executed in Phase 14.0 or 14.1.

---

# Phase 14.0 — Technical Baseline

## A. Current project anchors

| Area | Existing path | Phase 14 action |
|---|---|---|
| Dependencies/scripts | `package.json` | Install, lock, verify scripts |
| Prisma client | `lib/db.ts` | Confirm singleton and generated client |
| Database schema | `prisma/schema.prisma` | Validate existing models and migration history |
| Admin auth | `lib/auth/session.ts` | Reuse `requireAdmin()` for factory admin routes |
| SEO discovery | `lib/seo/tool-autopilot.ts` | Preserve deterministic signal analysis |
| Factory | `lib/seo/ai-tool-factory.ts` | Preserve current safe path; later delegate planning |
| Processor registry | `lib/tool-engine/registry.ts` | Remain trusted execution allowlist |
| Factory API | `app/api/admin/seo-autopilot/factory/route.ts` | Keep admin-only and review-only |
| Tests | `tests/` | Add unit/integration coverage |

## B. Required commands

Run from the application root (`phase10/phase9-work/`):

```bash
npm install
npm run db:generate
npm run typecheck
npm run lint
npm test
npm run build
```

With PostgreSQL running and `DATABASE_URL` configured:

```bash
npm run db:migrate -- --name phase14_baseline_check
npm run db:generate
```

Do not create a no-op migration merely to mark completion. Inspect `prisma migrate status` first and use a real migration only when schema changes are included.

## C. Required verification scenarios

- Public home, tool directory, tool detail, and localized routes render.
- Admin endpoints reject anonymous and non-admin requests.
- Keyword discovery is idempotent for repeated normalized keywords.
- Candidate generation creates exactly one `Tool`, `ToolVersion`, and pending `PublicationReview` per opportunity.
- Unsupported opportunities remain review-required and do not create a public tool.
- New candidates remain `REVIEW` and `indexable=false`.
- Sitemap excludes unpublished/non-indexable candidates.

## D. Phase 14.0 known engineering risks

- No lockfile is included in the uploaded archive.
- No successful full build/test result is documented.
- The current candidate endpoint checks for an existing slug before the transaction; concurrent requests can race. Add a database-backed unique/idempotency strategy and catch Prisma unique-constraint conflicts.
- The candidate and version/review records are created transactionally, but the audit log is written after the transaction. Decide whether audit failure should fail the request or be recorded via an outbox pattern.
- `GenerationJob` does not yet include a worker lease, heartbeat, or idempotency key. Add those only when durable workers are introduced.
- `AIProvider.config` must remain non-secret configuration only.

**Exit gate:** dependencies install; typecheck, lint, tests, and production build pass; Prisma schema/client are valid; the critical admin workflow passes against a disposable PostgreSQL database.

---

# Phase 14.1 — AI Provider & Orchestration Engine

## A. Scope

Implement a provider-neutral interface and routing policy first. Add provider adapters incrementally after contracts and tests are stable. The first supported live adapter should be selected after credentials and model availability are verified in the deployment environment.

### Files

```text
lib/ai/
  types.ts                 # Provider-neutral types and adapter contract
  config.ts                # Server-only environment configuration
  router.ts                # Capability/priority/fallback selection
  registry.ts              # Adapter registry (next implementation task)
  execute.ts               # Timeout, retry, fallback, and normalized result (next task)
  usage.ts                 # Usage normalization and persistence (next task)
  budgets.ts               # Per-task and per-period spend checks (next task)
  providers/
    openai.ts              # Adapter (next task)
    anthropic.ts           # Adapter (next task)
    gemini.ts              # Adapter (next task)
    groq.ts                # Adapter (next task)
    openrouter.ts          # Adapter (next task)
    mistral.ts             # Adapter (next task)
    cloudflare.ts          # Adapter (next task)
  prompts/
    planner.ts             # Versioned prompt templates (next task)
    generator.ts
    tester.ts
    reviewer.ts

tests/
  ai-router.test.ts
  ai-config.test.ts         # next task
  ai-execute.test.ts        # next task
```

Initial scaffold delivered in this archive: `types.ts`, `config.ts`, `router.ts`, and `ai-router.test.ts`.

## B. Contracts

### Tasks

- `keyword_analysis`
- `tool_planning`
- `tool_generation`
- `test_generation`
- `code_review`
- `translation_review`

Provider/model capability must be explicit. Do not assume every model supports every task.

### Provider adapter contract

`AIProviderAdapter.generate(config, input) -> AIResponse`

Normalized response fields:

- text
- provider ID
- model ID
- latency in milliseconds
- optional input/output/total token counts
- optional estimated cost
- optional provider request ID

Normalized error categories:

- not configured
- rate limited
- timeout
- authentication
- invalid response
- provider error

Errors must not expose API keys, raw authorization headers, or unredacted provider payloads in logs.

## C. Provider configuration policy

Environment variables already present in `.env.example`:

- OpenAI: `OPENAI_API_KEY`, `OPENAI_MODEL`
- Anthropic: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`
- Gemini: `GEMINI_API_KEY`, `GEMINI_PAID_MODEL`
- Groq: `GROQ_API_KEY`, `GROQ_MODEL`
- OpenRouter: `OPENROUTER_API_KEY`, `OPENROUTER_PAID_MODEL`
- Mistral: `MISTRAL_API_KEY`, `MISTRAL_MODEL`
- Cloudflare: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_MODEL`

The scaffold reads configured key/model pairs server-side. It does not persist them and does not expose them through an API. Task capabilities are opt-in through the corresponding `*_TASKS` environment variable (comma-separated task IDs); an empty value means the provider is not eligible for any task. This avoids assuming that a model supports a capability that has not been verified. Free-tier variables are not included in the initial router policy; free/paid selection should be explicit and modeled as separate deployment profiles in a later change.

## D. Routing algorithm

1. Receive a typed task.
2. Load enabled providers from server-side config/database policy.
3. Filter out providers without key or model.
4. Filter out providers that do not explicitly support the task.
5. Exclude providers already attempted for this request.
6. Sort by ascending priority; deterministic tie-break by provider ID.
7. Apply budget and rate-limit checks before invocation.
8. Invoke the selected adapter with a strict timeout and output-token cap.
9. Normalize response and usage.
10. On retryable failure, try the next eligible provider within a fixed attempt limit.
11. Persist redacted request metadata and usage.
12. Return a normalized result or a typed terminal error.

The router must not silently retry authentication failures or invalid input. Rate limits and transient provider/server failures may be retryable, subject to bounded backoff and total task deadline.

## E. API design (admin-only)

These routes are planned; do not expose provider secrets in responses.

### `GET /api/admin/ai/providers`

Returns configured provider IDs, enabled/health status, model labels, supported tasks, priority, and whether credentials are configured. Never returns keys, secret fragments, headers, or raw config JSON.

### `POST /api/admin/ai/providers/test`

Request:

```json
{ "provider": "openai", "task": "keyword_analysis" }
```

Behavior: require admin; validate provider/task; run a minimal bounded health prompt; redact response details; persist health check; enforce a per-provider test rate limit.

### `POST /api/admin/ai/preview`

Request:

```json
{
  "task": "tool_planning",
  "prompt": "Create a specification for a simple text utility",
  "maxOutputTokens": 1200
}
```

Behavior: admin-only development/operations endpoint; enforce prompt length, task allowlist, provider budget, timeout, and audit logging. It must not create or publish a tool.

No public-user AI endpoint is included in this phase.

## F. Persistence plan

Existing Prisma models:

- `AIProvider`
- `AIRequest`
- `AIUsage`
- `AIProviderHealth`

Use these as the first persistence layer, subject to schema review. Proposed safe additions after baseline validation:

- `AIProvider.capabilities Json?` — explicit task capabilities, no secrets.
- `AIProvider.lastErrorCode String?` — redacted health summary.
- `AIRequest.task String?` — task classification.
- `AIRequest.attempt Int @default(1)` — attempt number.
- `AIRequest.requestGroupId String?` — correlate fallback attempts.
- `AIRequest.promptVersion String?` — prompt auditability without storing sensitive prompt bodies.
- `AIUsage.inputTokens Int @default(0)` and `outputTokens Int @default(0)` — separate usage accounting.

Avoid storing raw prompts and completions by default. If debugging retention is later needed, use explicit opt-in, redaction, access control, and short retention.

Do not store API keys in `AIProvider.config`. Use environment variables or a dedicated secrets manager; the database stores only a secret reference/configured flag.

## G. Cost and reliability controls

- Maximum attempts per request: 2 provider attempts initially.
- Strict request timeout; configurable per task, with a hard server-side ceiling.
- Maximum output tokens required for generation tasks.
- Daily and monthly budget checks before every provider call.
- Per-provider concurrency and rate limits.
- Circuit breaker after repeated provider failures.
- Idempotency key for task execution where requests can be retried.
- Redacted logs and metrics.
- Usage cost is an estimate unless provider billing data confirms it.

Initial numeric limits must be configurable, not hard-coded into UI assumptions. Establish default values only after measuring the chosen models and hosting limits.

## H. Tests

Unit tests:

- provider filtering by task capability
- disabled/missing-key/missing-model providers are ignored
- deterministic priority and tie-break ordering
- fallback excludes attempted providers
- no provider configured returns a typed error
- timeout and retryable/non-retryable classification
- redaction removes secrets from errors/logs
- token/cost accounting handles missing provider usage fields
- budget rejection occurs before network call

Integration tests with mocked HTTP:

- successful adapter response normalized
- provider 429 causes bounded fallback
- provider 401 does not fallback indefinitely
- malformed response is rejected safely
- timeout aborts the request
- usage is persisted without prompt contents or secrets

## I. Phase 14.1 exit criteria

- At least two real provider adapters work with credentials supplied in the deployment environment.
- Provider selection is deterministic and task-capability-aware.
- Fallback is bounded and only used for retryable errors.
- Secrets never appear in database records, logs, or API responses.
- Usage and cost estimates are recorded and budget limits are enforced.
- Unit and mocked integration tests pass.
- Admin provider status/test endpoints are protected by `requireAdmin()`.

---

# Recommended implementation order

1. Complete Phase 14.0 verification and fix baseline issues.
2. Validate and test the provider config parser/router scaffold.
3. Implement one provider adapter end-to-end, including error normalization and usage.
4. Add a second adapter and verify fallback.
5. Add persistence and admin status/test routes.
6. Add budget/rate-limit enforcement and observability.
7. Only then connect the planner to the orchestration engine in Phase 14.2.

## Phase 14.1 implementation update (2026-11-22)

Implemented in this working branch:
- OpenAI-compatible adapter for OpenAI, Groq, OpenRouter, and Mistral endpoints.
- Anthropic Messages API adapter.
- Deterministic priority routing and retryable-error fallback in `lib/ai/engine.ts`.
- Admin-only provider inventory endpoint (`GET /api/admin/ai/providers`) that omits credentials.
- Admin-only preview endpoint (`POST /api/admin/ai/preview`) with Zod validation and request metadata audit.
- Provider response usage (token counts) captured where providers return usage metadata. Cost is deliberately not guessed without a configured pricing table.

Not implemented yet: Gemini and Cloudflare adapters, cost estimation/pricing registry, durable per-provider health circuit breaker, admin UI, rate/budget enforcement, comprehensive integration tests. Preview API does not persist prompts or completions.
