import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Keep uploads outside the public web root. Configure a persistent volume in production.
const root = path.resolve(process.env.FTF_STORAGE_DIR || path.join(process.cwd(), '.private-storage'));
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
const TYPES: Record<string, { mime: string; kind: 'pdf' | 'zip' | 'text' }> = {
  pdf: { mime: 'application/pdf', kind: 'pdf' },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', kind: 'zip' },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', kind: 'zip' },
  pptx: { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', kind: 'zip' },
  csv: { mime: 'text/csv', kind: 'text' }, txt: { mime: 'text/plain', kind: 'text' }, md: { mime: 'text/markdown', kind: 'text' },
};
export function validateFile(name: string, bytes: Buffer) {
  const extension = path.extname(name).slice(1).toLowerCase();
  const spec = TYPES[extension];
  if (!spec) throw new Error('UNSUPPORTED_FILE_TYPE');
  if (!bytes.length || bytes.length > MAX_FILE_BYTES) throw new Error('INVALID_FILE_SIZE');
  if (spec.kind === 'pdf' && bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('INVALID_FILE_CONTENT');
  if (spec.kind === 'zip' && !(bytes[0] === 0x50 && bytes[1] === 0x4b)) throw new Error('INVALID_FILE_CONTENT');
  if (spec.kind === 'text' && bytes.includes(0)) throw new Error('INVALID_FILE_CONTENT');
  return { extension, mimeType: spec.mime, checksum: createHash('sha256').update(bytes).digest('hex') };
}
export async function savePrivateFile(bytes: Buffer) {
  await mkdir(root, { recursive: true, mode: 0o700 });
  const key = randomUUID();
  await writeFile(path.join(root, key), bytes, { flag: 'wx', mode: 0o600 });
  return key;
}
function resolveKey(key: string) {
  if (!/^[0-9a-f-]{36}$/i.test(key)) throw new Error('INVALID_STORAGE_KEY');
  return path.join(root, key);
}
export const readPrivateFile = (key: string) => readFile(resolveKey(key));
export const deletePrivateFile = (key: string) => rm(resolveKey(key), { force: true });
