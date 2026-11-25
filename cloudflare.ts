import { AIProviderError, type AIProviderAdapter, type AIProviderConfig, type AIRequestInput, type AIResponse } from '../types';

export class CloudflareAdapter implements AIProviderAdapter {
  readonly id = 'cloudflare' as const;
  async generate(config: AIProviderConfig, input: AIRequestInput): Promise<AIResponse> {
    if (!config.accountId) throw new AIProviderError('Cloudflare account ID is missing', 'NOT_CONFIGURED', false, this.id);
    const started = Date.now(); const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 45_000);
    try {
      const endpoint = config.baseUrl?.trim() || `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/ai/run/${config.model}`;
      const response = await fetch(endpoint, { method: 'POST', signal: controller.signal, headers: { Authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'system', content: input.system }, { role: 'user', content: input.prompt }], temperature: input.temperature ?? 0.2, max_tokens: input.maxOutputTokens ?? 1200 }) });
      const payload = await response.json().catch(() => null) as any;
      if (!response.ok) {
        const code = response.status === 401 || response.status === 403 ? 'AUTHENTICATION' : response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_ERROR';
        throw new AIProviderError(`Cloudflare returned HTTP ${response.status}`, code, response.status === 429 || response.status >= 500, this.id);
      }
      const text = payload?.result?.response ?? payload?.result?.choices?.[0]?.message?.content ?? '';
      if (typeof text !== 'string' || !text.trim()) throw new AIProviderError('Empty or invalid Cloudflare response', 'INVALID_RESPONSE', false, this.id);
      const usage = payload?.result?.usage;
      return { text, provider: this.id, model: config.model, latencyMs: Date.now() - started, requestId: response.headers.get('cf-ray') ?? undefined, usage: usage ? { inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens, totalTokens: usage.total_tokens } : undefined };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (controller.signal.aborted) throw new AIProviderError('Cloudflare request timed out', 'TIMEOUT', true, this.id);
      throw new AIProviderError('Network error calling Cloudflare', 'PROVIDER_ERROR', true, this.id);
    } finally { clearTimeout(timeout); }
  }
}
