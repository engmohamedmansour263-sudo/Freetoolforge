import { describe, expect, it } from 'vitest';
import { buildFactoryManifest } from '@/lib/seo/ai-tool-factory';
import { validateToolManifest } from '@/lib/tool-validation/manifest';

describe('AI Tool Factory', () => {
  it('builds a multilingual review manifest from a supported keyword variant', () => {
    const result = buildFactoryManifest({ keyword: 'online discount calculator', impressions: 800, clicks: 14, position: 9 });
    expect(result).not.toBeNull();
    expect(result?.manifest.status).toBe('review');
    expect(result?.manifest.localizedSeo.ar.title).toContain('حاسبة الخصم');
    expect(result?.manifest.localizedContent.hi.howTo.length).toBeGreaterThan(1);
    expect(result?.manifest.safety.arbitraryCode).toBe(false);
    expect(validateToolManifest(result?.manifest).success).toBe(true);
  });

  it('runs regression tests before declaring a generated candidate ready', () => {
    const result = buildFactoryManifest({ keyword: 'online discount calculator' });
    expect(result?.manifest.quality.passed).toBe(true);
    expect(result?.manifest.quality.score).toBe(100);
    expect(result?.manifest.quality.checks.every((check) => check.passed)).toBe(true);
  });

  it('does not fabricate processors for unsupported search intents', () => {
    expect(buildFactoryManifest({ keyword: 'AI mortgage refinance analyzer' })).toBeNull();
  });

  it('does not create a duplicate of a tool already in the registry', () => {
    expect(buildFactoryManifest({ keyword: 'Discount Calculator' })).toBeNull();
  });
});
