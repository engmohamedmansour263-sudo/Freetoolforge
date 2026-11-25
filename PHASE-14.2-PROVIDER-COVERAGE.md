# Phase 14.2 — Provider coverage and diagnostics

## Implemented
- Gemini `generateContent` adapter with system instruction, token limit, timeout, usage metadata, and retry classification.
- Cloudflare Workers AI adapter using account ID, API token, model slug, timeout, usage parsing where available.
- Adapter registration in the AI orchestration engine.
- Admin-only connection test endpoint: `POST /api/admin/ai/providers/test`.
  - JSON body: `{ "provider": "gemini", "task": "tool_planning" }`
  - Test prompt is fixed and minimal; output is clipped to 100 characters.
  - API keys are never included in responses.
- Unit tests for adapter parsing and routing.

## Environment variables
- `GEMINI_API_KEY`, `GEMINI_PAID_MODEL`, `GEMINI_TASKS`
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_MODEL`, `CLOUDFLARE_TASKS`

## Limitations / next gate
- No live provider credentials were available, so real network checks were not run.
- Pricing and budget controls are not yet implemented. Do not estimate costs from hardcoded price lists; configure model-specific rates and update them when providers change prices.
- Provider health history and circuit-breaker state are future work.
- Run `npm install`, `npm run typecheck`, `npm test`, and `npm run build` before deployment.
