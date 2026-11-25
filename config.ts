import type { AIProviderConfig, AIProviderId, AITask } from './types';

const VALID_TASKS = new Set<AITask>([
  'keyword_analysis', 'tool_planning', 'tool_generation',
  'test_generation', 'code_review', 'translation_review',
]);

function parseTasks(value: string | undefined): AITask[] {
  if (!value?.trim()) return [];
  return [...new Set(value.split(',').map((item) => item.trim()).filter((item): item is AITask =>
    VALID_TASKS.has(item as AITask),
  ))];
}

function provider(
  id: AIProviderId,
  apiKey: string | undefined,
  model: string | undefined,
  priority: number,
  tasksValue: string | undefined,
  extra: Pick<AIProviderConfig, 'baseUrl' | 'accountId'> = {},
): AIProviderConfig | null {
  if (!apiKey?.trim() || !model?.trim()) return null;
  return {
    id,
    apiKey: apiKey.trim(),
    model: model.trim(),
    enabled: true,
    priority,
    tasks: parseTasks(tasksValue),
    ...extra,
  };
}

/** Reads secrets only from the server environment; never expose this module to client components. */
export function getConfiguredAIProviders(env: NodeJS.ProcessEnv = process.env): AIProviderConfig[] {
  const providers = [
    provider('openai', env.OPENAI_API_KEY, env.OPENAI_MODEL, 10, env.OPENAI_TASKS),
    provider('anthropic', env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL, 20, env.ANTHROPIC_TASKS),
    provider('gemini', env.GEMINI_API_KEY, env.GEMINI_PAID_MODEL, 30, env.GEMINI_TASKS),
    provider('groq', env.GROQ_API_KEY, env.GROQ_MODEL, 40, env.GROQ_TASKS),
    provider('openrouter', env.OPENROUTER_API_KEY, env.OPENROUTER_PAID_MODEL, 50, env.OPENROUTER_TASKS),
    provider('mistral', env.MISTRAL_API_KEY, env.MISTRAL_MODEL, 60, env.MISTRAL_TASKS),
    provider(
      'cloudflare',
      env.CLOUDFLARE_API_TOKEN,
      env.CLOUDFLARE_MODEL,
      70,
      env.CLOUDFLARE_TASKS,
      { accountId: env.CLOUDFLARE_ACCOUNT_ID },
    ),
  ];
  return providers.filter((item): item is AIProviderConfig => item !== null);
}
