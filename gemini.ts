import { AIProviderError, type AIProviderAdapter, type AIProviderConfig, type AIRequestInput, type AIResponse } from '../types';

export class GeminiAdapter implements AIProviderAdapter {
  readonly id = 'gemini' as const;
  async generate(config: AIProviderConfig, input: AIRequestInput): Promise<AIResponse> {
    const started = Date.now(); const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 45_000);
    try {
      const endpoint = config.baseUrl?.trim() || `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`;
      const response = await fetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${encodeURIComponent(config.apiKey)}`, {
        method: 'POST', signal: controller.signal, headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: input.system }] }, contents: [{ role: 'user', parts: [{ text: input.prompt }] }], generationConfig: { temperature: input.temperature ?? 0.2, maxOutputTokens: input.maxOutputTokens ?? 1200 } }),
      });
      const payload = await response.json().catch(() => null) as any;
      if (!response.ok) {
        const code = response.status === 401 || response.status === 403 ? 'AUTHENTICATION' : response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_ERROR';
        throw new AIProviderError(`Gemini returned HTTP ${response.status}`, code, response.status === 429 || response.status >= 500, this.id);
      }
      const text = payload?.candidates?.[0]?.content?.parts?.map((part: any) => typeof part.text === 'string' ? part.text : '').join('') ?? '';
      if (!text.trim()) throw new AIProviderError('Empty or invalid Gemini response', 'INVALID_RESPONSE', false, this.id);
      const usage = payload?.usageMetadata;
      return { text, provider: this.id, model: config.model, latencyMs: Date.now() - started, requestId: response.headers.get('x-request-id') ?? undefined, usage: usage ? { inputTokens: usage.promptTokenCount, outputTokens: usage.candidatesTokenCount, totalTokens: usage.totalTokenCount } : undefined };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (controller.signal.aborted) throw new AIProviderError('Gemini request timed out', 'TIMEOUT', true, this.id);
      throw new AIProviderError('Network error calling Gemini', 'PROVIDER_ERROR', true, this.id);
    } finally { clearTimeout(timeout); }
  }
}
