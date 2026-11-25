import { getTool, runTool } from '@/lib/tool-engine/registry';

export type ToolExecution = { ok: true; slug: string; output: string } | { ok: false; error: string };

/** Executes only registered, reviewed processors. Never evaluates generated source code. */
export function executeRegisteredTool(slug: string, input: string, extra = ''): ToolExecution {
  const tool = getTool(slug);
  if (!tool) return { ok: false, error: 'Tool not found.' };
  if (typeof input !== 'string' || typeof extra !== 'string') return { ok: false, error: 'Input must be text.' };
  if (input.length > 100_000 || extra.length > 10_000) return { ok: false, error: 'Input is too large. Maximum input is 100 KB.' };
  try {
    return { ok: true, slug, output: runTool(tool.kind, input, extra) };
  } catch {
    return { ok: false, error: 'The tool could not process this input. Check the input and try again.' };
  }
}
