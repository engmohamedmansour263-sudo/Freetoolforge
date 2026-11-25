export type KeywordSignal = {
  keyword: string;
  impressions: number;
  clicks: number;
  position: number | null;
  suggestedSlug?: string | null;
  status?: string;
};

export function classifyKeywordSignal(signal: KeywordSignal) {
  const impressions = Math.max(0, Math.trunc(signal.impressions || 0));
  const clicks = Math.max(0, Math.trunc(signal.clicks || 0));
  const ctrPercent = impressions > 0 ? Number((clicks / impressions * 100).toFixed(2)) : null;
  const position = typeof signal.position === 'number' && Number.isFinite(signal.position) && signal.position > 0
    ? Number(signal.position.toFixed(2)) : null;
  let opportunity: 'LOW_CTR' | 'STRIKING_DISTANCE' | 'HIGH_VISIBILITY' | 'LOW_DATA' = 'LOW_DATA';
  let recommendation = 'اجمع بيانات إضافية قبل اتخاذ قرار.';
  if (impressions >= 100 && position !== null && position >= 3 && position <= 20 && ctrPercent !== null && ctrPercent < 3) {
    opportunity = 'LOW_CTR';
    recommendation = 'راجع عنوان الصفحة والوصف ومدى مطابقتهما لنية البحث؛ لا تغيّر المحتوى دون مراجعة.';
  } else if (impressions >= 50 && position !== null && position > 8 && position <= 20) {
    opportunity = 'STRIKING_DISTANCE';
    recommendation = 'راجع جودة المحتوى والروابط الداخلية ومدى تغطيتهما لنية البحث.';
  } else if (impressions >= 100 && position !== null && position <= 8) {
    opportunity = 'HIGH_VISIBILITY';
    recommendation = 'راقب الأداء وحافظ على العناصر التي تحقق ظهوراً جيداً.';
  }
  return { keyword: signal.keyword, impressions, clicks, ctrPercent, position, opportunity, recommendation, suggestedSlug: signal.suggestedSlug ?? null, status: signal.status ?? null };
}

export function summarizeKeywordSignals(signals: KeywordSignal[]) {
  const rows = signals.map(classifyKeywordSignal);
  return {
    totals: {
      keywords: rows.length,
      impressions: rows.reduce((sum, row) => sum + row.impressions, 0),
      clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
      measurable: rows.filter(row => row.opportunity !== 'LOW_DATA').length,
    },
    opportunities: rows.sort((a, b) => b.impressions - a.impressions || (a.position ?? Infinity) - (b.position ?? Infinity)),
  };
}
