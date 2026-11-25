# FreeToolForge

An early-stage Next.js foundation for a free utilities directory. The current release includes a responsive directory, category pages, a client-side tool runner, 46 tools across Text, SEO, Developer, Calculators, and Generators, and a starter Prisma schema, and an editable template library with copy/download.

## Run locally

1. Install Node.js 20+.
2. `npm install`
3. Copy `.env.example` to `.env` and configure values as needed.
4. `npm run dev`
5. Open http://localhost:3000

Most tools work without a database or AI credentials. PostgreSQL is required before using the planned persistent/admin functionality. To set up Prisma: `npx prisma generate`, then `npx prisma migrate dev` after setting `DATABASE_URL`.

## Checks

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Current scope / limitations

This is the first implementation milestone. Tool directory and the implemented browser-side utilities are functional. Templates now have a client-side variable editor, live preview, copy, and Markdown download. AI providers, authenticated admin workflows, persistent analytics, job queue, AdSense, consent management, and automated publishing are not implemented yet. Do not deploy the admin or AI endpoints as production functionality until authentication, rate limiting, security review, and the remaining features are added.

## Admin dashboard

Configure `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env` (use a strong password of at least 12 characters), then run:

```bash
npm install
npm run db:generate
npm run db:migrate -- --name admin_auth
npm run db:seed-admin
npm run dev
```

Open `/admin/login` to access the protected dashboard. Admin accounts are provisioned from the environment variables by `npm run db:seed-admin`.

## Admin content management (Phase 5)

Sign in with an account whose `role` is `ADMIN`, then open `/admin`. The content manager supports tools, templates, and users. Its protected API is rooted at `/api/admin/manage/{tools|templates|users}` and accepts `GET`, `POST`, `PATCH`, and `DELETE` requests. Tool creation requires a manifest that passes `validateToolManifest`; template and user input are validated server-side. Mutations are written to `AuditLog`.

Before using the admin area, configure `DATABASE_URL`, run `npm run db:generate`, apply migrations with `npm run db:migrate`, and create the first administrator with `npm run db:seed-admin`.

## Internationalization (i18n)

The application supports English (`/en`), Arabic (`/ar`), Hindi (`/hi`), and Bengali (`/bn`) with locale-aware routing, a persistent locale cookie, translated public pages, and RTL document direction for Arabic. Unprefixed URLs use English by default unless a non-default locale has been selected. Add future locales in `lib/i18n/index.ts` and provide corresponding message, content, and UI dictionaries.

## Supported languages

The current interface supports English (`en`), Arabic (`ar`), Hindi (`hi`), and Bengali (`bn`). Language-prefixed URLs are available at `/en`, `/ar`, `/hi`, and `/bn`. Arabic uses RTL layout; English, Hindi, and Bengali use LTR layout.

Localization covers all registered built-in tool names and descriptions, tool detail pages and runner controls, the eight built-in template bodies, legal pages, admin sign-in/dashboard/content manager, and localized sitemap language alternates. Tool slugs and variable tokens remain stable across locales. User-created templates and admin-authored database records are not automatically translated; owners should provide language-specific content and review SEO copy before launch. Some technical output formats (for example JSON, XML, generated code, UUIDs, passwords, and user-provided text) intentionally remain unchanged.

### Phase 8 — Full-site localization

The phase 8 release adds translated catalog copy for all 46 built-in tools and localized title, description, and body content for all eight built-in templates in Arabic, Hindi, and Bengali. Tool slugs and template variable tokens are kept stable. The tool runner, legal pages, admin sign-in, admin dashboard, content manager, and route-specific metadata now follow the selected locale. Sitemap entries include language alternates.

Custom templates and database-managed records are authored by the site owner/admin and are not automatically translated. Generated formats such as JSON/XML/code, UUIDs, passwords, and user-provided text intentionally remain unchanged. Review all translated copy and legal text with native speakers and qualified counsel before public launch.

### Phase 9 — International SEO foundations

Set `APP_URL` to the canonical public HTTPS origin before deployment. The site emits absolute canonical and locale alternate URLs (`hreflang`, including `x-default`), Open Graph and Twitter metadata, a locale-aware sitemap, robots rules, and JSON-LD for the website, utility pages, breadcrumbs, and category collections. Validate the deployed URLs using Google Search Console and rich-result/schema validation tools before relying on indexing or rich results.


### Localized SEO guides
Visit `/seo-guides` for localized tool collection landing pages in English, Arabic, Hindi, and Bengali. These pages link to focused tools and include starter FAQs. Search-volume validation and native-speaker review are recommended before launch.

### Keyword-focused SEO landing pages

The `/use-cases/[slug]` route currently includes localized task guides for word counting, JSON formatting, percentage calculations, and meta descriptions. Each guide has unique locale copy, related tool links, localized metadata, Article/FAQ structured data, and sitemap entries. Add new slugs to `lib/seo/landing-pages.ts` and keep all four locale entries complete.

### SEO Tool Autopilot (Phase 10)
The admin dashboard includes an SEO keyword opportunity importer. Paste one keyword per line to identify gaps against the current tool registry. Supported intents are matched only to already-reviewed built-in processors. The system creates unpublished `REVIEW` candidates with `indexable=false`; unsupported intents remain queued for engineering review. No candidate is auto-published. Apply the Prisma migrations before using it.

## Google Search Console integration

The SEO Autopilot can import real query, impressions, clicks, and average-position data from Google Search Console. Configure the server-only `GOOGLE_SEARCH_CONSOLE_SITE_URL`, `GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL`, and `GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY` variables, grant that service account access to the exact Search Console property, then use the import button in `/admin`. See `docs/GOOGLE-SEARCH-CONSOLE-SETUP.md` for setup and limits. The integration is read-only and currently runs on an admin-triggered basis; it does not perform unattended scheduled imports.


### Phase 12 — Search Opportunity Intelligence
The admin dashboard ranks keyword opportunities using impressions, clicks, approximate CTR expectations by average position, and a transparent 0–100 heuristic. It classifies low-CTR/no-click signals, striking-distance rankings, and low-visibility queries, then recommends whether to improve an existing page or investigate a new tool. This score is not a search-volume or ranking forecast. Generated candidates remain unpublished and non-indexable until a human reviews functionality, UX, localization, privacy, and SEO.

### Phase 13: AI Tool Factory

The admin SEO opportunity panel can now build review-only tool candidates from supported opportunities. It creates multilingual manifests, runs dedicated regression checks against existing trusted processors, and stores passing candidates as `REVIEW` with `indexable=false`. Unsupported ideas are routed to engineering review; arbitrary generated code is never executed. See `docs/IMPLEMENTATION-STATUS.md` for current limits.

### Autonomous factory background workers

Run the persistent factory worker process with `npm run worker:factory`. Configure `FACTORY_WORKER_CONCURRENCY` (default `2`, maximum `16`) and `FACTORY_WORKER_POLL_MS` (default `2000`). In Docker Compose, `docker compose up -d --build` starts a dedicated `factory-worker` service alongside the web app and PostgreSQL. Apply Prisma migrations before starting workers. Admin queue metrics are available at `GET /api/admin/factory/metrics`.

## Roadmap extensions: Phases 19–22

- **Phase 19 Global SEO & Localization:** `lib/global-seo/markets.ts` provides a small market catalog and deterministic seed-keyword expansions. These ideas are not search-volume or SERP measurements; `requiresResearch` flags that validation against localized search data is still needed.
- **Phase 20 Monetization:** `lib/monetization/plans.ts` defines initial plan/credit policy helpers. Price fields for paid tiers are intentionally unset pending billing configuration. This is not yet a payment integration or persisted usage ledger.
- **Phase 21 Infrastructure:** `lib/infrastructure/ttl-cache.ts` offers bounded process-local TTL caching for simple use. Production multi-instance cache/queue requires shared infrastructure (e.g. Redis) and configuration.
- **Phase 22 Security baseline:** `next.config.ts` adds baseline response headers. This is not a penetration test, complete CSP, or enterprise security certification.

## Roadmap extensions: Phases 19–22

- **Phase 19 Global SEO & Localization:** `lib/global-seo/markets.ts` provides a small market catalog and deterministic seed-keyword expansions. These ideas are not search-volume or SERP measurements; `requiresResearch` flags that validation against localized search data is still needed.
- **Phase 20 Monetization:** `lib/monetization/plans.ts` defines initial plan/credit policy helpers. Price fields for paid tiers are intentionally unset pending billing configuration. This is not yet a payment integration or persisted usage ledger.
- **Phase 21 Infrastructure:** `lib/infrastructure/ttl-cache.ts` offers bounded process-local TTL caching for simple use. Production multi-instance cache/queue requires shared infrastructure (e.g. Redis) and configuration.
- **Phase 22 Security baseline:** `next.config.ts` adds baseline response headers. This is not a penetration test, complete CSP, or enterprise security certification.
