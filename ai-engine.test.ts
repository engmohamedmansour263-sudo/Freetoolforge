import { describe, expect, it, vi } from 'vitest';
import { runAI } from '../lib/ai/engine';
import { AIProviderError, type AIProviderConfig } from '../lib/ai/types';

const base = (id: AIProviderConfig['id'], priority: number): AIProviderConfig => ({ id, apiKey: 'test-key', model: 'test-model', enabled: true, priority, tasks: ['tool_planning'] });

describe('AI engine routing/fallback', () => {
  it('throws NOT_CONFIGURED when task has no eligible providers', async () => {
    await expect(runAI({ task: 'tool_planning', system: 's', prompt: 'p' }, [])).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
  });
  it('does not retry non-retryable provider failures', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: 'bad' }), { status: 401 }));
    try { await expect(runAI({ task: 'tool_planning', system: 's', prompt: 'p' }, [base('openai', 1), base('groq', 2)])).rejects.toMatchObject({ code: 'AUTHENTICATION' }); }
    finally { fetchSpy.mockRestore(); }
  });
  it('falls through to next provider on retryable failure', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 429 })).mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }], usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 } }), { status: 200 }));
    try {
      const result = await runAI({ task: 'tool_planning', system: 's', prompt: 'p' }, [base('openai', 1), base('groq', 2)]);
      expect(result.text).toBe('ok'); expect(result.provider).toBe('groq'); expect(result.usage?.totalTokens).toBe(5); expect(fetchSpy).toHaveBeenCalledTimes(2);
    } finally { fetchSpy.mockRestore(); }
  });
});

describe('additional provider adapters', () => {
  it('parses Gemini response and usage metadata', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'gemini ok' }] } }], usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 2, totalTokenCount: 6 } }), { status: 200 }));
    try {
      const result = await runAI({ task: 'tool_planning', system: 's', prompt: 'p' }, [base('gemini', 1)]);
      expect(result.text).toBe('gemini ok'); expect(result.usage?.totalTokens).toBe(6);
    } finally { fetchSpy.mockRestore(); }
  });
  it('uses Cloudflare account ID in endpoint and extracts response', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ result: { response: 'cf ok' } }), { status: 200 }));
    const cf = { ...base('cloudflare', 1), accountId: 'account-test' };
    try {
      const result = await runAI({ task: 'tool_planning', system: 's', prompt: 'p' }, [cf]);
      expect(result.text).toBe('cf ok'); expect(String(fetchSpy.mock.calls[0][0])).toContain('account-test');
    } finally { fetchSpy.mockRestore(); }
  });
});
