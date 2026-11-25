import type { AIProviderConfig, AITask } from './types';

/**
 * Deterministic provider selection. It does not call a provider and does not
 * infer capabilities: a provider must explicitly list the task it supports.
 */
export function selectAIProviders(
  providers: AIProviderConfig[],
  task: AITask,
  excluded: AIProviderConfig['id'][] = [],
): AIProviderConfig[] {
  return providers
    .filter((provider) =>
      provider.enabled &&
      Boolean(provider.apiKey.trim()) &&
      Boolean(provider.model.trim()) &&
      provider.tasks.includes(task) &&
      !excluded.includes(provider.id),
    )
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
}

export function selectPrimaryAIProvider(
  providers: AIProviderConfig[],
  task: AITask,
  excluded: AIProviderConfig['id'][] = [],
): AIProviderConfig | null {
  return selectAIProviders(providers, task, excluded)[0] ?? null;
}
