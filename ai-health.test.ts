import { describe, expect, it, vi } from 'vitest';
import { isCircuitOpen, recordProviderFailure, recordProviderSuccess, getCircuitSnapshot } from '../lib/ai/health';

describe('AI provider circuit breaker', () => {
  it('opens after configured threshold and resets after success', () => {
    vi.stubEnv('AI_CIRCUIT_FAILURE_THRESHOLD', '3');
    recordProviderFailure('openai'); recordProviderFailure('openai');
    expect(isCircuitOpen('openai')).toBe(false);
    recordProviderFailure('openai');
    expect(isCircuitOpen('openai')).toBe(true);
    recordProviderSuccess('openai');
    expect(isCircuitOpen('openai')).toBe(false);
    vi.unstubAllEnvs();
  });
  it('exposes provider state snapshot', () => {
    recordProviderFailure('gemini');
    expect(getCircuitSnapshot().some((s) => s.provider === 'gemini')).toBe(true);
  });
});
