import { describe, expect, it } from 'vitest';
import { estimateCost, getModelPrice } from '../lib/ai/pricing';

describe('AI model price registry via environment', () => {
  it('reads model-specific price and calculates estimated cost', () => {
    const env = { AI_PRICE_OPENAI_GPT_4O_MINI_INPUT_PER_1K_USD: '0.00015', AI_PRICE_OPENAI_GPT_4O_MINI_OUTPUT_PER_1K_USD: '0.0006' } as NodeJS.ProcessEnv;
    expect(getModelPrice('openai', 'gpt-4o-mini', env)).toEqual({ inputUsdPer1K: 0.00015, outputUsdPer1K: 0.0006 });
    expect(estimateCost('openai', 'gpt-4o-mini', { inputTokens: 1000, outputTokens: 1000 }, env)).toBeCloseTo(0.00075);
  });
  it('does not invent a price for unknown models', () => {
    expect(estimateCost('gemini', 'unknown-model', { inputTokens: 20, outputTokens: 10 }, {} as NodeJS.ProcessEnv)).toBeUndefined();
  });
  it('uses generic fallback only when configured', () => {
    const env = { AI_COST_PER_1K_INPUT_USD: '0.01', AI_COST_PER_1K_OUTPUT_USD: '0.02' } as NodeJS.ProcessEnv;
    expect(estimateCost('groq', 'some-model', { inputTokens: 500, outputTokens: 100 }, env)).toBeCloseTo(0.007);
  });
});
