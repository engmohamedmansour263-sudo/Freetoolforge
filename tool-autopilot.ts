import { createHash } from 'node:crypto';
import { tools } from '@/lib/tool-engine/registry';

export type KeywordSignal = { keyword: string; impressions?: number; clicks?: number; position?: number; source?: string };
export type ToolBlueprint = { name: string; slug: string; description: string; category: string; kind: string; keywords: string[]; supported: boolean; reason?: string };

const rules: Array<{ pattern: RegExp; name: (q: string) => string; kind: string; category: string; description: (q: string) => string }> = [
  { pattern: /\b(word|character|sentence|paragraph|line)\s+counter\b/i, name: q => title(q), kind: 'count', category: 'Text', description: q => `Count words, characters, sentences, paragraphs and lines in text with the ${q} tool.` },
  { pattern: /\b(json)\s+(formatter|format|beautifier)\b/i, name: () => 'JSON Formatter', kind: 'jsonFormat', category: 'Developer', description: q => `Format and validate JSON input using ${q}.` },
  { pattern: /\b(json)\s+validator\b/i, name: () => 'JSON Validator', kind: 'jsonValidate', category: 'Developer', description: q => `Validate JSON syntax and report whether the supplied data is valid with ${q}.` },
  { pattern: /\b(base64)\s+(encoder|encode)\b/i, name: () => 'Base64 Encoder', kind: 'b64encode', category: 'Developer', description: q => `Encode text into Base64 format with ${q}.` },
  { pattern: /\b(base64)\s+(decoder|decode)\b/i, name: () => 'Base64 Decoder', kind: 'b64decode', category: 'Developer', description: q => `Decode Base64 text into readable text with ${q}.` },
  { pattern: /\b(url)\s+(encoder|encode)\b/i, name: () => 'URL Encoder', kind: 'urlencode', category: 'Developer', description: q => `Encode text safely for use in URLs with ${q}.` },
  { pattern: /\b(url)\s+(decoder|decode)\b/i, name: () => 'URL Decoder', kind: 'urldecode', category: 'Developer', description: q => `Decode URL-encoded text with ${q}.` },
  { pattern: /\b(keyword)\s+density\b/i, name: () => 'Keyword Density Checker', kind: 'density', category: 'SEO', description: q => `Measure keyword frequency and density in text using ${q}.` },
  { pattern: /\b(meta\s+title|seo\s+title)\s+generator\b/i, name: () => 'Meta Title Generator', kind: 'metaTitle', category: 'SEO', description: q => `Create a concise SEO title using ${q}.` },
  { pattern: /\b(meta\s+description)\s+generator\b/i, name: () => 'Meta Description Generator', kind: 'metaDescription', category: 'SEO', description: q => `Draft a concise meta description using ${q}.` },
  { pattern: /\b(discount)\s+calculator\b/i, name: () => 'Discount Calculator', kind: 'discount', category: 'Calculators', description: q => `Calculate discounted prices and savings using ${q}.` },
  { pattern: /\b(percentage|percent)\s+calculator\b/i, name: () => 'Percentage Calculator', kind: 'percentage', category: 'Calculators', description: q => `Calculate percentages quickly using ${q}.` },
];
const title = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase()).slice(0, 90);
const slugify = (s: string) => { const base = s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80); return base || `keyword-tool-${createHash('sha1').update(s.toLowerCase()).digest('hex').slice(0, 10)}`; };

export function buildKeywordBlueprint(signal: KeywordSignal): ToolBlueprint | null {
  const keyword = signal.keyword.trim().replace(/\s+/g, ' ');
  if (keyword.length < 3 || keyword.length > 120) return null;
  const existing = tools.find(t => [t.name, t.slug, ...t.keywords].some(v => v.toLowerCase() === keyword.toLowerCase()) || t.name.toLowerCase() === keyword.toLowerCase());
  if (existing) return null;
  const rule = rules.find(r => r.pattern.test(keyword));
  if (!rule) return { name: title(keyword), slug: slugify(keyword), description: `A proposed tool for the search intent: ${keyword}. Its processing logic is not yet supported by the safe built-in engine.`, category: 'SEO Opportunities', kind: 'unsupported', keywords: [keyword], supported: false, reason: 'No reviewed processor matches this keyword; human/engineering review is required.' };
  const slug = slugify(keyword);
  if (!slug || tools.some(t => t.slug === slug)) return null;
  return { name: rule.name(keyword), slug, description: rule.description(keyword), category: rule.category, kind: rule.kind, keywords: [keyword], supported: true };
}

export type OpportunityAnalysis = {
  priority: number;
  ctr: number;
  opportunityType: 'low_ctr' | 'striking_distance' | 'low_visibility' | 'no_clicks' | 'insufficient_data';
  recommendation: string;
};

/**
 * A transparent heuristic, not a search-volume forecast. It favors queries with
 * meaningful impressions, weak CTR, and positions close enough to improve.
 */
export function analyzeKeywordOpportunity(signal: KeywordSignal): OpportunityAnalysis {
  const impressions = Math.max(0, signal.impressions ?? 0);
  const clicks = Math.max(0, signal.clicks ?? 0);
  const position = signal.position && signal.position > 0 ? signal.position : null;
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const expectedCtr = position === null ? 0.03
    : position <= 3 ? 0.10
    : position <= 5 ? 0.06
    : position <= 10 ? 0.03
    : position <= 20 ? 0.012 : 0.004;
  const ctrGap = Math.max(0, expectedCtr - ctr);
  const volumeScore = Math.min(35, Math.log10(impressions + 1) * 9);
  const positionScore = position === null ? 0
    : position <= 20 ? Math.max(0, 25 - Math.abs(position - 8) * 1.1) : Math.max(0, 8 - (position - 20) * 0.15);
  const ctrScore = impressions >= 30 ? Math.min(25, (ctrGap / Math.max(expectedCtr, 0.005)) * 25) : 0;
  const clickSignal = clicks > 0 ? Math.min(10, Math.log10(clicks + 1) * 4) : (impressions >= 30 ? 7 : 0);
  const priority = Math.round(Math.max(0, Math.min(100, volumeScore + positionScore + ctrScore + clickSignal)));
  let opportunityType: OpportunityAnalysis['opportunityType'] = 'insufficient_data';
  let recommendation = 'اجمع بيانات إضافية قبل اتخاذ قرار بناء الأداة.';
  if (impressions >= 30 && clicks === 0) {
    opportunityType = 'no_clicks';
    recommendation = 'افحص نية البحث وملاءمة الصفحة والعنوان؛ الظهور دون نقرات لا يعني تلقائياً الحاجة إلى أداة جديدة.';
  } else if (impressions >= 30 && ctrGap >= expectedCtr * 0.5) {
    opportunityType = 'low_ctr';
    recommendation = 'راجع تطابق نية البحث والعنوان والوصف، ثم قيّم ما إذا كانت أداة مخصصة ستخدم الباحث.';
  } else if (impressions < 30) {
    opportunityType = 'low_visibility';
    recommendation = 'البيانات قليلة؛ لا تنشئ أداة اعتماداً على هذه الإشارة وحدها.';
  } else if (position !== null && position >= 4 && position <= 20) {
    opportunityType = 'striking_distance';
    recommendation = 'فرصة لتحسين الصفحة الحالية أو إضافة وظيفة مكملة قبل إنشاء صفحة جديدة.';
  }
  return { priority, ctr: Number((ctr * 100).toFixed(2)), opportunityType, recommendation };
}

export function calculateOpportunityPriority(signal: KeywordSignal) {
  return analyzeKeywordOpportunity(signal).priority;
}
