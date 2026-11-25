# GitHub Repository Review — 2026-11-25

## Scope and method

This review was performed against the GitHub branch `codex/engineering-baseline-review` only. No ZIP archive or local working copy was used. The branch currently contains 108 tracked files. The repository's tracked tree was inspected and key application, configuration, PDF, worker, schema, and test files were read through GitHub.

## Confirmed blocking findings

### 1. Application source layout does not match the imports or Next.js App Router

The tracked tree contains `page.tsx`, `layout.tsx`, `globals.css`, and `route.ts` at the repository root. It does not contain an `app/` or `src/app/` directory. Next.js App Router expects its route entry points under one of those directories.

The same tree contains no `lib/` or `components/` directories, while the inspected files import modules from paths such as `@/lib/tool-engine/registry`, `@/lib/i18n`, `@/components/site-header`, and `@/lib/tool-processing`. The inspected source therefore references tracked paths that are absent from this branch tree.

**Impact:** the application cannot be considered buildable from the current tracked tree. The missing source layout/dependencies must be restored or the imports and application structure must be deliberately refactored before a build can pass.

### 2. Worker command points to a missing path

`package.json` defines `worker:factory` as `tsx scripts/factory-worker.ts`, while the tracked worker file is at repository root as `factory-worker.ts`; no `scripts/` directory is present.

**Impact:** the documented worker command cannot resolve its entry file in this tree.

### 3. README references absent source/documentation paths

The README references paths including `docs/GOOGLE-SEARCH-CONSOLE-SETUP.md`, `docs/IMPLEMENTATION-STATUS.md`, `lib/i18n/index.ts`, `lib/seo/landing-pages.ts`, and `lib/infrastructure/ttl-cache.ts`. Those paths are not present in the tracked tree.

**Impact:** parts of the setup and architecture documentation do not match the repository contents.

### 4. PDF extraction return type is inconsistent

In `pdf.ts`, `PdfExtraction` declares only `text`, `pageCount`, and `pages`, but `extractPdfText` returns additional `processedPages` and `truncated` properties.

**Impact:** the declared API contract does not describe the returned value and may fail strict TypeScript checking where the return value is checked against `Promise<PdfExtraction>`.

### 5. Reproducible dependency installation is not established

`package.json` exists, but no `package-lock.json` is tracked. The Dockerfile runs `npm install` rather than `npm ci`, and suppresses Prisma generation failures with `|| true`.

**Impact:** dependency resolution is not lockfile-reproducible, and the image build can proceed past a failed Prisma generation step only to fail later or produce an incomplete build.

## Verification status

- GitHub tree and selected source files: inspected.
- Automated lint, typecheck, tests, production build, and Prisma validation: **not run**. The GitHub file API provides source access but does not execute repository scripts.
- No code behavior is claimed as runtime-verified.
- No source files were deleted or overwritten as part of this review.

## Recommended repair order

1. Restore the complete intended source tree (especially `app/`, `lib/`, `components/`, `prisma/`, and `tests/`) from the authoritative GitHub project history/branch, or explicitly migrate the project to a consistent layout.
2. Reconcile the worker script path and README references with the actual tree.
3. Correct the PDF extraction type contract and add/adjust tests for page and text truncation.
4. Generate and commit the npm lockfile; change the Docker dependency stage to `npm ci` and fail the image build if Prisma generation fails.
5. Run lint, typecheck, tests, Prisma validation, and production build in GitHub Actions before proposing merge.

This report records verified repository-state issues; it is not a claim that these repairs have already been applied.
