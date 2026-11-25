# Phase 14.4 — Pricing estimates and orchestration hardening

## Implemented
- Model/provider-specific rates can be configured using `AI_PRICE_<PROVIDER>_<MODEL>_INPUT_PER_1K_USD` and `...OUTPUT_PER_1K_USD`.
- Names are normalized to uppercase underscore keys (e.g. `openai` + `gpt-4o-mini` -> `AI_PRICE_OPENAI_GPT_4O_MINI_*`).
- If both per-model rates are present and valid, they override generic rates.
- Generic `AI_COST_PER_1K_INPUT_USD` / `AI_COST_PER_1K_OUTPUT_USD` remain as a fallback.
- Unknown models have no estimated cost unless generic fallback is configured; rates are not fabricated.
- `runAI` fills estimated cost only if the provider did not return it.
- Unit tests cover model rate parsing, calculation, unknown pricing, and generic fallback.

## Limits / operator action
Prices are operator-configured estimates and must be checked against the provider's current pricing and billing units. This is not real billing reconciliation. Existing daily/monthly budget checks are aggregate checks and are not atomic reservations; concurrent requests may overshoot a configured limit. Production strict budgets require an atomic reservation ledger or serialized transaction design.
