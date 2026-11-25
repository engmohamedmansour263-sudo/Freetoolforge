/** Shared, provider-neutral contracts for the FreeToolForge AI layer. */
export const AI_TASKS = [
  'keyword_analysis',
  'tool_planning',
  'tool_generation',
  'test_generation',
  'code_review',
  'translation_review',
] as const;

export type AITask = (typeof AI_TASKS)[number];
export type AIProviderId = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter' | 'mistral' | 'cloudflare';

export type AIProviderConfig = {
  id: AIProviderId;
  model: string;
  enabled: boolean;
  priority: number;
  /** Tasks explicitly enabled for this provider/model pair. */
  tasks: AITask[];
  /** Secret is read at runtime and must never be persisted in provider config JSON. */
  apiKey: string;
  baseUrl?: string;
  accountId?: string;
};

export type AIRequestInput = {
  task: AITask;
  system: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
};

export type AIUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
};

export type AIResponse = {
  text: string;
  provider: AIProviderId;
  model: string;
  latencyMs: number;
  usage?: AIUsage;
  requestId?: string;
};

export type AIProviderFailureCode =
  | 'NOT_CONFIGURED'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'AUTHENTICATION'
  | 'INVALID_RESPONSE'
  | 'PROVIDER_ERROR';

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code: AIProviderFailureCode,
    public readonly retryable: boolean,
    public readonly provider?: AIProviderId,
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export interface AIProviderAdapter {
  readonly id: AIProviderId;
  generate(config: AIProviderConfig, input: AIRequestInput): Promise<AIResponse>;
}
