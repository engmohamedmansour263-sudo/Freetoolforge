export type ToolPerformanceInput = { toolId: string; name: string; slug: string; views: number; runs: number; periodDays: number };
export type ToolOptimizationInsight = ToolPerformanceInput & { conversionRate: number; priority: number; issue: 'LOW_ENGAGEMENT' | 'LOW_CONVERSION' | 'INSUFFICIENT_DATA'; recommendations: string[] };

/** Uses observed first-party events only. It never estimates impressions, rankings, or revenue. */
export function analyzeToolPerformance(input: ToolPerformanceInput): ToolOptimizationInsight {
  const conversionRate = input.views > 0 ? Math.round((input.runs / input.views) * 10_000) / 100 : 0;
  let issue: ToolOptimizationInsight['issue'] = 'INSUFFICIENT_DATA';
  const recommendations: string[] = [];
  if (input.views >= 30 && conversionRate < 10) {
    issue = 'LOW_CONVERSION';
    recommendations.push('راجع وضوح زر التشغيل ومكانه.', 'أضف مثالاً قصيراً يوضح المدخلات والنتيجة المتوقعة.', 'قلّل الحقول غير الضرورية قبل تشغيل الأداة.');
  } else if (input.views >= 30 && input.runs < 10) {
    issue = 'LOW_ENGAGEMENT';
    recommendations.push('حسّن وصف الأداة والعنوان لشرح القيمة مباشرة.', 'أضف مثالاً جاهزاً قابلاً للتجربة.');
  } else {
    recommendations.push('اجمع بيانات استخدام إضافية قبل اقتراح تغيير جوهري.');
  }
  const priority = Math.min(100, Math.round(Math.min(input.views, 500) / 5 + Math.max(0, 20 - conversionRate) * 2));
  return { ...input, conversionRate, priority, issue, recommendations };
}
