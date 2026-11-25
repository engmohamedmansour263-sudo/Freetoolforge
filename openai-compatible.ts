import { AIProviderError, type AIProviderAdapter, type AIProviderConfig, type AIRequestInput, type AIResponse } from '../types';

const ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
};

export class OpenAICompatibleAdapter implements AIProviderAdapter {
  constructor(readonly id: AIProviderConfig['id']) {}

  async generate(config: AIProviderConfig, input: AIRequestInput): Promise<AIResponse> {
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 45_000);
    try {
      const url = config.baseUrl?.trim() || ENDPOINTS[this.id];
      if (!url) throw new AIProviderError('Provider endpoint is not configured', 'NOT_CONFIGURED', false, this.id);
      const response = await fetch(url, {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.model, messages: [{ role: 'system', content: input.system }, { role: 'user', content: input.prompt }], temperature: input.temperature ?? 0.2, max_tokens: input.maxOutputTokens ?? 1200 }),
      });
      const payload = await response.json().catch(() => null) as any;
      if (!response.ok) {
        const code = response.status === 401 || response.status === 403 ? 'AUTHENTICATION' : response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_ERROR';
        throw new AIProviderError(`Provider returned HTTP ${response.status}`, code, response.status === 429 || response.status >= 500, this.id);
      }
      const text = payload?.choices?.[0]?.message?.content;
      if (typeof text !== 'string' || !text.trim()) throw new AIProviderError('Empty or invalid provider response', 'INVALID_RESPONSE', false, this.id);
      const usage = payload?.usage;
      return { text, provider: this.id, model: config.model, latencyMs: Date.now() - started, requestId: response.headers.get('x-request-id') ?? payload?.id, usage: usage ? { inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens, totalTokens: usage.total_tokens } : undefined };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (controller.signal.aborted) throw new AIProviderError('Provider request timed out', 'TIMEOUT', true, this.id);
      throw new AIProviderError('Network error calling provider', 'PROVIDER_ERROR', true, this.id);
    } finally { clearTimeout(timeout); }
  }
}
