import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executeRegisteredTool } from '@/lib/tool-processing';
import { executeDatabaseTool } from '@/lib/tool-processing/database';

const InputSchema = z.object({ input: z.string().max(100_000), extra: z.string().max(10_000).optional() }).strict();
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.', details: parsed.error.flatten() }, { status: 400 });
  const result = executeRegisteredTool(slug, parsed.data.input, parsed.data.extra ?? '');
  const finalResult = result.ok || result.error !== 'Tool not found.' ? result : await executeDatabaseTool(slug, parsed.data.input, parsed.data.extra ?? '') ?? result;
  return NextResponse.json(finalResult, { status: finalResult.ok ? 200 : finalResult.error === 'Tool not found.' ? 404 : 422 });
}
