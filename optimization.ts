export type SEOInput = {
  name: string;
  slug: string;
  description: string;
  manifest: unknown;
};
export type SEORecommendation = {
  id: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
};
export type SEOAnalysis = {
  score: number;
  title: string;
  metaDescription: string;
  recommendations: SEORecommendation[];
  proposedSeo: { title: string; description: string };
};

function getSeo(manifest: unknown): { title?: string; description?: string } {
  if (!manifest || typeof manifest !== 'object') return {};
  const root = manifest as Record<string, unknown>;
  const seo = root.seo;
  if (!seo || typeof seo !== 'object') return {};
  const value = seo as Record<string, unknown>;
  return {
    title: typeof value.title === 'string' ? value.title : undefined,
    description: typeof value.description === 'string' ? value.description : undefined,
  };
}

/** Deterministic on-page checks only; no ranking, traffic, or revenue claims. */
export function analyzeSEO(input: SEOInput): SEOAnalysis {
  const current = getSeo(input.manifest);
  const title = (current.title ?? input.name).trim();
  const description = (current.description ?? input.description).trim();
  const recommendations: SEORecommendation[] = [];
  let score = 100;
  if (!title) { score -= 30; recommendations.push({ id: 'missing-title', severity: 'high', message: 'أضف عنوان صفحة فريداً يصف وظيفة الأداة.' }); }
  else if (title.length < 25 || title.length > 65) { score -= 15; recommendations.push({ id: 'title-length', severity: 'medium', message: 'راجع طول العنوان؛ النطاق الإرشادي هنا 25–65 حرفاً.' }); }
  if (!description) { score -= 25; recommendations.push({ id: 'missing-description', severity: 'high', message: 'أضف وصفاً يشرح فائدة الأداة وما الذي يحصل عليه المستخدم.' }); }
  else if (description.length < 70 || description.length > 170) { score -= 15; recommendations.push({ id: 'description-length', severity: 'medium', message: 'راجع طول الوصف؛ النطاق الإرشادي هنا 70–170 حرفاً.' }); }
  if (title.toLocaleLowerCase().includes(input.name.toLocaleLowerCase()) === false) { score -= 10; recommendations.push({ id: 'title-topic', severity: 'medium', message: 'اجعل اسم الأداة أو موضوعها الأساسي واضحاً في العنوان.' }); }
  if (description && !/[.!؟]$/.test(description)) { score -= 5; recommendations.push({ id: 'description-clarity', severity: 'low', message: 'اختم الوصف بدعوة واضحة أو نتيجة متوقعة.' }); }
  if (!recommendations.length) recommendations.push({ id: 'healthy-metadata', severity: 'low', message: 'لم تُكتشف مشكلة أساسية في بيانات العنوان والوصف وفق الفحوصات الحالية.' });

  const proposedTitle = `${input.name} – FreeToolForge`.slice(0, 65);
  const benefit = input.description.replace(/\s+/g, ' ').trim();
  const proposedDescription = `${benefit}${/[.!؟]$/.test(benefit) ? '' : '.'} جرّب الأداة مجاناً عبر الإنترنت.`.slice(0, 170);
  return {
    score: Math.max(0, Math.min(100, score)), title, metaDescription: description,
    recommendations,
    proposedSeo: { title: proposedTitle, description: proposedDescription },
  };
}
