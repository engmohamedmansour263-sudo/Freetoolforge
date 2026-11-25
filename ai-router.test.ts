import { describe, expect, it } from 'vitest';
import { selectAIProviders, selectPrimaryAIProvider } from '@/lib/ai/router';
import type { AIProviderConfig } from '@/lib/ai/types';

const provider = (overrides: Partial<AIProviderConfig> = {}): AIProviderConfig => ({
  id: 'openai', model: 'test-model', apiKey: 'test-key', enabled: true,
  priority: 10, tasks: ['tool_planning'], ...overrides,
});

describe('AI provider router', () => {
  it('selects enabled providers that explicitly support the requested task', () => {
    const providers = [
      provider({ id: 'anthropic', priority: 20, tasks: ['tool_planning'] }),
      provider({ id: 'groq', priority: 5, tasks: ['keyword_analysis'] }),
      provider({ id: 'openrouter', priority: 30, enabled: false }),
    ];
    expect(selectAIProviders(providers, 'tool_planning').map((item) => item.id)).toEqual(['anthropic']);
  });

  it('orders eligible providers by ascending priority', () => {
    const providers = [
      provider({ id: 'anthropic', priority: 20 }),
      provider({ id: 'openai', priority: 10 }),
    ];
    expect(selectAIProviders(providers, 'tool_planning').map((item) => item.id)).toEqual(['openai', 'anthropic']);
  });

  it('supports fallback by excluding providers already attempted', () => {
    const providers = [
      provider({ id: 'openai', priority: 10 }),
      provider({ id: 'anthropic', priority: 20 }),
    ];
    expect(selectPrimaryAIProvider(providers, 'tool_planning', ['openai'])?.id).toBe('anthropic');
  });

  it('does not select providers without credentials or model names', () => {
    const providers = [provider({ apiKey: '' }), provider({ id: 'anthropic', model: ' ' })];
    expect(selectAIProviders(providers, 'tool_planning')).toEqual([]);
  });
});
