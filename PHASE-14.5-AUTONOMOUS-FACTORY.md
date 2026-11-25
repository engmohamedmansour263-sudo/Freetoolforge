# Phase 14.5 — Autonomous Factory Pipeline

This phase adds a safe, deterministic orchestration layer around the existing keyword-to-blueprint factory. It is not an arbitrary-code generation or automatic publication system.

## Stages
1. Analyze: validate keyword signal.
2. Blueprint: match intent to an existing reviewed processor.
3. Build: assemble a tool manifest.
4. Regression: verify the manifest's processor checks.
5. Safety: assert reviewed processor, no arbitrary code, no network/file access.
6. Review: accept a candidate for admin review only.

## API
`POST /api/admin/seo-autopilot/factory/pipeline`

Example payload:
```json
{"keyword":"word counter for writers","impressions":100,"clicks":4,"position":9,"source":"manual"}
```

Endpoint requires admin authentication. The response includes each stage, candidate manifest when supported, and explicit `requiresHumanReview: true`, `publishable: false` flags. Unsupported ideas return 422. This endpoint does not persist a candidate; use the existing factory endpoint for the transactional candidate creation flow after review of the pipeline result.

## Safety boundary
No model-produced code is evaluated. The only executable tool logic comes from the trusted processor registry. Automatic publication is intentionally disabled.
