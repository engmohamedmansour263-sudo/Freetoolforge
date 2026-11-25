# Phase 23 — PDF Processing Foundation

## Delivered in this preview
- Authenticated, ownership-scoped PDF operations endpoint.
- `inspect`: page count, page dimensions, and standard metadata using pdf-lib. No credits charged.
- `extract-text`: page-by-page text extraction using PDF.js; 2 credits charged only after successful extraction.
- Operation history records for success and parse failures.
- Workspace UI actions and bounded text preview (100,000 characters).
- Prisma migration for `DocumentOperation`.

## API
- `POST /api/files/:id/operations` with `{ "operation": "inspect" }`
- `POST /api/files/:id/operations` with `{ "operation": "extract-text" }`
- `GET /api/files/:id/operations` returns up to 30 recent operations for the owned file.

## Security and limitations
- Authentication and file ownership are checked before reading the private file.
- Parsing runs in the Node.js runtime; PDF.js is configured with `isEvalSupported: false`.
- Encrypted PDFs or malformed PDFs return a controlled processing error.
- This is not malware scanning, OCR, redaction, or a guarantee that scanned-image PDFs contain extractable text.
- Merge, split, compression, Office parsing, background processing, and persistent operation result storage are not included yet.
- Run Prisma generation/migration, typecheck, tests, and production build before deployment.
