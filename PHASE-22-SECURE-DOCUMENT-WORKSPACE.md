# Phase 22 — Secure Document Workspace

## Scope delivered
- Authenticated file listing, upload, download, and deletion endpoints.
- Ownership enforced in every file lookup; unauthenticated requests are rejected.
- Private filesystem storage outside `public/`, random opaque storage keys, restrictive directory/file permissions, SHA-256 checksums.
- File metadata persisted in PostgreSQL through `UserFile` and a dedicated migration.
- Initial allowlist: PDF, DOCX, XLSX, PPTX, CSV, TXT, MD. Upload cap: 20 MiB.
- Basic signature checks for PDF and ZIP-based Office formats; NUL-byte rejection for text files.
- Arabic workspace UI at `/workspace`.

## Deployment requirements / limitations
- Set `FTF_STORAGE_DIR` to a private, persistent volume mounted outside the web root. The default `.private-storage` is suitable only for local development or a single persistent host; ephemeral/serverless disks are not supported for durable uploads.
- Apply migration `20261125100000_document_workspace` and regenerate Prisma Client before deployment.
- Configure reverse-proxy/platform request-body limits consistently with the 20 MiB application limit.
- For multi-instance production, replace the local filesystem adapter with private object storage and lifecycle policies. Do not expose bucket objects publicly.
- Antivirus/malware scanning, OCR, document parsing, quotas, retention policies, and encryption-at-rest key management are not part of this phase.
- Office ZIP signature checks are only a basic file-type gate, not a malware or structural safety scan.

## Verification status
- Source files and ZIP archive integrity should be checked after packaging.
- TypeScript, Prisma generation/migration against a live database, automated tests, and production build require dependencies and a configured PostgreSQL database; they are not represented as passed in this phase.
