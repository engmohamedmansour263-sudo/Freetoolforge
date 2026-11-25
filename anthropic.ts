import { AIProviderError, type AIProviderAdapter, type AIProviderConfig, type AIRequestInput, type AIResponse } from '../types';

export class AnthropicAdapter implements AIProviderAdapter {
  readonly id = 'anthropic' as const;
  async generate(config: AIProviderConfig, input: AIRequestInput): Promise<AIResponse> {
    const started = Date.now(); const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 45_000);
    try {
      const response = await fetch(config.baseUrl?.trim() || 'https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: controller.signal,
        headers: { 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: config.model, system: input.system, messages: [{ role: 'user', content: input.prompt }], temperature: input.temperature ?? 0.2, max_tokens: input.maxOutputTokens ?? 1200 }),
      });
      const payload = await response.json().catch(() => null) as any;
      if (!response.ok) {
        const code = response.status === 401 || response.status === 403 ? 'AUTHENTICATION' : response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_ERROR';
        throw new AIProviderError(`Anthropic returned HTTP ${response.status}`, code, response.status === 429 || response.status >= 500, this.id);
      }
      const text = Array.isArray(payload?.content) ? payload.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n') : '';
      if (!text.trim()) throw new AIProviderError('Empty or invalid provider response', 'INVALID_RESPONSE', false, this.id);
      const usage = payload?.usage;
      return { text, provider: this.id, model: config.model, latencyMs: Date.now() - started, requestId: response.headers.get('request-id') ?? payload?.id, usage: usage ? { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens, totalTokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0) } : undefined };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (controller.signal.aborted) throw new AIProviderError('Provider request timed out', 'TIMEOUT', true, this.id);
      throw new AIProviderError('Network error calling Anthropic', 'PROVIDER_ERROR', true, this.id);
    } finally { clearTimeout(timeout); }
  }
}
