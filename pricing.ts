import type { AIProviderId, AIUsage } from './types';

export type ModelPrice = { inputUsdPer1K: number; outputUsdPer1K: number };

function normalizeKey(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Explicit per-provider/model pricing from environment. Unknown models are never assigned invented prices. */
export function getModelPrice(provider: AIProviderId, model: string, env: NodeJS.ProcessEnv = process.env): ModelPrice | null {
  const prefix = `AI_PRICE_${normalizeKey(provider)}_${normalizeKey(model)}`;
  const input = env[`${prefix}_INPUT_PER_1K_USD`];
  const output = env[`${prefix}_OUTPUT_PER_1K_USD`];
  if (input === undefined || output === undefined || input.trim() === '' || output.trim() === '') return null;
  const inputRate = Number(input); const outputRate = Number(output);
  if (!Number.isFinite(inputRate) || !Number.isFinite(outputRate) || inputRate < 0 || outputRate < 0) return null;
  return { inputUsdPer1K: inputRate, outputUsdPer1K: outputRate };
}

export function estimateCost(provider: AIProviderId, model: string, usage: AIUsage, env: NodeJS.ProcessEnv = process.env): number | undefined {
  const rates = getModelPrice(provider, model, env);
  if (rates && (usage.inputTokens !== undefined || usage.outputTokens !== undefined)) {
    return ((usage.inputTokens ?? 0) * rates.inputUsdPer1K + (usage.outputTokens ?? 0) * rates.outputUsdPer1K) / 1000;
  }
  const genericInput = Number(env.AI_COST_PER_1K_INPUT_USD || 0);
  const genericOutput = Number(env.AI_COST_PER_1K_OUTPUT_USD || 0);
  if ((genericInput || genericOutput) && (usage.inputTokens !== undefined || usage.outputTokens !== undefined)) {
    return ((usage.inputTokens ?? 0) * genericInput + (usage.outputTokens ?? 0) * genericOutput) / 1000;
  }
  return undefined;
}
