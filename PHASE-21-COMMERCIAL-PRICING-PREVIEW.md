# Phase 21 — Commercial pricing preview

## Goal
Create a transparent commercial packaging surface before payment integration. This phase does not collect payments or activate paid subscriptions.

## Included
- Added five plan tiers: Free, Starter, Pro, Business, Enterprise.
- Added indicative USD price hypotheses: $0, $5.99, $12.99, $39/month, and custom Enterprise.
- Added indicative monthly credit allowances and feature positioning.
- Added `/pricing` page and navigation entry.
- Updated `GET /api/monetization/plans` to expose preview status and explicitly state billing is not configured.
- Preserved the existing persistent credit account and ledger model.

## Commercial safeguards
- Prices are hypotheses for customer interviews and conversion experiments, not active checkout offers.
- No payment provider, webhook, tax calculation, invoice generation, or paid-plan activation was added.
- Do not advertise paid plan activation until provider webhooks, entitlement transitions, refunds, and reconciliation are implemented and tested.
- Credit amounts must be calibrated against measured compute, AI, storage, OCR, image-generation, and support costs.

## Validation status
- Source edits completed.
- Automated typecheck, lint, tests, and production build have not yet been run in this environment; project dependencies are not installed in the working directory.
- No database migration was added in this phase.

## Next phase
Phase 22 should implement a real document workspace foundation: upload policy, file metadata, private storage abstraction, file lifecycle, ownership checks, quotas, and deletion controls before connecting document AI or OCR providers.
