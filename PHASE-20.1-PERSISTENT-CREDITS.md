# Phase 20.1 — Persistent credit accounts and usage ledger

## Added
- Per-user credit account with a rolling 30-day allowance period.
- Append-only usage ledger with a unique idempotency key.
- Authenticated `GET /api/monetization/credits` to read the current account.
- Authenticated `POST /api/monetization/credits` to atomically consume credits.
- Serializable transaction boundary, conditional balance update, replay protection, and conflict detection.

## Safety and scope
- The client cannot choose a plan or user ID; identity comes from the existing session.
- The endpoint charges usage only; it does not accept credit grants or plan upgrades.
- Paid prices, payment-provider webhooks, refunds, taxes, invoices, and subscription lifecycle remain unimplemented.
- The 30-day period is a temporary allowance window, not calendar-month billing.
- The existing preview endpoints remain available and are not silently promoted to production billing.

## Apply and verify
1. Install dependencies and configure PostgreSQL.
2. Run `npx prisma generate`.
3. Run `npx prisma migrate deploy` (or `npm run db:migrate` in development).
4. Run `npm run typecheck`, `npm test`, and `npm run build`.
5. Verify authenticated and unauthenticated requests, insufficient balance, duplicate idempotency keys, and concurrent consumption against PostgreSQL.

No production deployment or payment activation is implied by this phase.
