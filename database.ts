import { prisma } from '@/lib/db';
import { tools, runTool, type ToolDef } from '@/lib/tool-engine/registry';

/** Database-backed execution is restricted to processors already shipped and reviewed in the static registry. */
export async function executeDatabaseTool(slug: string, input: string, extra = '') {
  const record = await prisma.tool.findFirst({ where: { slug, status: 'PUBLISHED', indexable: true }, include: { category: true } });
  if (!record) return null;
  const manifest = record.manifest as { kind?: string; keywords?: string[] };
  const approved = tools.find(tool => tool.kind === manifest.kind);
  if (!approved) return { ok: false as const, error: 'This generated tool does not use an approved processor.' };
  if (input.length > 100_000 || extra.length > 10_000) return { ok: false as const, error: 'Input is too large.' };
  try { return { ok: true as const, slug, output: runTool(approved.kind, input, extra) }; }
  catch { return { ok: false as const, error: 'The tool could not process this input.' }; }
}

export async function getPublishedDatabaseTool(slug: string): Promise<ToolDef | null> {
  const record = await prisma.tool.findFirst({ where: { slug, status: 'PUBLISHED', indexable: true }, include: { category: true } });
  if (!record) return null;
  const manifest = record.manifest as { kind?: string; keywords?: string[] };
  if (!tools.some(tool => tool.kind === manifest.kind)) return null;
  return { slug: record.slug, name: record.name, description: record.description, category: record.category.name, keywords: manifest.keywords ?? [record.name.toLowerCase()], kind: manifest.kind! };
}
