import { createHash } from 'node:crypto';
import { analyzeKeywordOpportunity, buildKeywordBlueprint, type KeywordSignal } from '@/lib/seo/tool-autopilot';

export type DiscoverySignal = KeywordSignal & { source?: string };
export type DiscoveryResult = {
  fingerprint: string;
  keyword: string;
  score: number;
  opportunityType: string;
  ctr: number;
  recommendation: string;
  blueprintSupported: boolean;
  blueprint: ReturnType<typeof buildKeywordBlueprint>;
};

export function normalizeDiscoveryKeyword(value: string) {
  return value.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

export function fingerprintDiscoveryKeyword(value: string) {
  return createHash('sha256').update(normalizeDiscoveryKeyword(value)).digest('hex');
}

/** Scores supplied search signals transparently; it does not invent search volume or fetch external data. */
export function analyzeDiscoverySignal(signal: DiscoverySignal): DiscoveryResult | null {
  const keyword = signal.keyword.trim().replace(/\s+/g, ' ');
  if (keyword.length < 3 || keyword.length > 120) return null;
  const analysis = analyzeKeywordOpportunity({ ...signal, keyword });
  const blueprint = buildKeywordBlueprint({ ...signal, keyword });
  return {
    fingerprint: fingerprintDiscoveryKeyword(keyword), keyword,
    score: analysis.priority, opportunityType: analysis.opportunityType,
    ctr: analysis.ctr, recommendation: analysis.recommendation,
    blueprintSupported: Boolean(blueprint?.supported), blueprint,
  };
}
