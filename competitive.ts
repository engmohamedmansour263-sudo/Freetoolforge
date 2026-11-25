import { analyzeDiscoverySignal, type DiscoverySignal } from '@/lib/discovery/engine';

export type CompetitorObservation = {
  title: string;
  url: string;
  snippet?: string;
  toolLike?: boolean;
  missingFeatures?: string[];
};

export type CompetitiveOpportunity = {
  keyword: string;
  score: number;
  demandScore: number;
  gapScore: number;
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  competitorCount: number;
  toolCompetitorCount: number;
  featureGaps: string[];
  recommendation: string;
  blueprintSupported: boolean;
  evidence: { impressions: number; clicks: number; ctr: number; position: number | null; competitors: CompetitorObservation[] };
};

function clamp(value: number, min = 0, max = 100) { return Math.max(min, Math.min(max, value)); }
function validHttpUrl(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:'; }
  catch { return false; }
}

/** Uses only supplied Search Console and SERP observations; it does not fetch or invent competitor data. */
export function analyzeCompetitiveOpportunity(
  signal: DiscoverySignal,
  competitors: CompetitorObservation[],
): CompetitiveOpportunity | null {
  const base = analyzeDiscoverySignal(signal);
  if (!base) return null;
  const safeCompetitors = competitors.slice(0, 20).filter((item) =>
    item.title.trim().length > 0 && item.title.length <= 240 && validHttpUrl(item.url),
  ).map((item) => ({
    title: item.title.trim(), url: new URL(item.url).toString(),
    ...(item.snippet ? { snippet: item.snippet.slice(0, 500) } : {}),
    toolLike: Boolean(item.toolLike),
    missingFeatures: (item.missingFeatures ?? []).map((v) => v.trim()).filter(Boolean).slice(0, 10),
  }));
  const impressions = signal.impressions ?? 0;
  const clicks = signal.clicks ?? 0;
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const demandScore = clamp(Math.round(Math.log10(impressions + 1) * 18 + (impressions > 0 ? Math.max(0, 0.12 - ctr) * 100 : 0)));
  const toolCompetitorCount = safeCompetitors.filter((item) => item.toolLike).length;
  const uniqueGaps = [...new Set(safeCompetitors.flatMap((item) => item.missingFeatures ?? []))].slice(0, 20);
  const gapScore = clamp(Math.round(100 - toolCompetitorCount * 18 + Math.min(uniqueGaps.length, 5) * 8));
  const score = clamp(Math.round(demandScore * 0.45 + gapScore * 0.35 + base.score * 0.2));
  const competitionLevel = toolCompetitorCount >= 4 ? 'HIGH' : toolCompetitorCount >= 2 ? 'MEDIUM' : 'LOW';
  const recommendation = !base.blueprintSupported
    ? 'الفكرة تحتاج معالجاً موثوقاً قبل إرسالها إلى التصنيع.'
    : safeCompetitors.length === 0
      ? 'أضف نتائج بحث موثقة قبل اتخاذ قرار تنافسي.'
      : uniqueGaps.length > 0
        ? `اختبر أداة تميّزها الميزات غير المغطاة: ${uniqueGaps.slice(0, 3).join('، ')}`
        : competitionLevel === 'HIGH'
          ? 'المنافسة على أدوات مشابهة مرتفعة؛ ابحث عن تخصص أدق قبل البناء.'
          : 'الفرصة تستحق مراجعة بشرية وتجربة نموذج أولي.';
  return {
    keyword: base.keyword, score, demandScore, gapScore, competitionLevel,
    competitorCount: safeCompetitors.length, toolCompetitorCount,
    featureGaps: uniqueGaps, recommendation, blueprintSupported: base.blueprintSupported,
    evidence: { impressions, clicks, ctr: Number(ctr.toFixed(4)), position: signal.position ?? null, competitors: safeCompetitors },
  };
}
