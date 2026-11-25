# Phase 15.6 — Safe SEO Application

## Scope

This phase adds an explicit apply operation for SEO optimization drafts. Approval remains a separate human action; only an `APPROVED` draft can be applied.

## Endpoint

`POST /api/admin/seo-optimization/drafts/:id/apply`

The endpoint requires an authenticated administrator and performs a serializable database transaction. It validates the proposed title (1–65 characters) and description (1–170 characters), verifies that the target tool remains published, and compares the draft's `baseVersion` with the latest `ToolVersion`.

On success it:

1. Preserves a baseline `ToolVersion` for older tools that did not yet have a version row.
2. Creates the next `ToolVersion` containing the new manifest.
3. Changes only `manifest.seo.title` and `manifest.seo.description`.
4. Marks the draft `APPLIED`.
5. Writes an audit event.

The tool's `status`, `indexable`, slug, processor, and all non-SEO manifest fields are preserved. A stale draft returns HTTP 409 and must be re-analyzed rather than overwriting newer edits.

## Rollback

The previous `ToolVersion` remains stored and can be used by a future dedicated rollback operation. This phase does not expose an automatic rollback endpoint yet; rollback must not be represented as available until that operation is implemented and tested.

## Verification

Pure helper tests cover manifest preservation and version increment validation. Full integration tests require installed dependencies and a PostgreSQL database; they have not been run in this environment.
