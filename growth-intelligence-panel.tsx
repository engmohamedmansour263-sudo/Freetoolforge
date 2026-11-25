'use client';
import { useCallback, useEffect, useState } from 'react';

type Insight = { toolId: string; name: string; slug: string; views: number; runs: number; conversionRate: number; priority: number; issue: string; recommendations: string[] };
type Payload = { summary: { publishedTools: number; measuredTools: number; lowConversion: number }; instrumentation: { eventCount: number; note: string }; insights: Insight[] };
const issueLabels: Record<string, string> = { LOW_CONVERSION: 'تحويل منخفض', LOW_ENGAGEMENT: 'تفاعل منخفض', INSUFFICIENT_DATA: 'بيانات غير كافية' };
export default function GrowthIntelligencePanel() {
  const [data, setData] = useState<Payload | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const refresh = useCallback(async () => { setLoading(true); try { const response = await fetch('/api/admin/growth/insights?days=30', { cache: 'no-store' }); const body = await response.json(); if (!response.ok) throw new Error(body.error ?? 'تعذر تحميل التحليلات'); setData(body); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'حدث خطأ'); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return <section className="admin-panel" style={{ marginTop: 24 }}>
    <div className="admin-section-head"><div><h2>ذكاء النمو وتحسين الأدوات</h2><p className="admin-muted">تحليل أحداث الاستخدام الفعلية للأدوات المنشورة خلال آخر 30 يوماً.</p></div><button className="btn secondary" onClick={() => void refresh()} disabled={loading}>{loading ? 'جارٍ التحديث…' : 'تحديث'}</button></div>
    {error && <p role="alert" className="admin-muted">{error}</p>}
    {data && <><div className="admin-stats" style={{ margin: '16px 0' }}>{[['الأدوات المنشورة', data.summary.publishedTools], ['أدوات لديها بيانات', data.summary.measuredTools], ['تحويل منخفض', data.summary.lowConversion], ['الأحداث المرصودة', data.instrumentation.eventCount]].map(([label, value]) => <article className="admin-stat" key={label}><span>{label}</span><strong>{Number(value).toLocaleString('en')}</strong></article>)}</div>
    {data.insights.length === 0 ? <p className="admin-muted">لا توجد أدوات منشورة لتحليلها.</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>الأداة</th><th>المشاهدات</th><th>التشغيل</th><th>معدل التشغيل</th><th>الأولوية</th><th>التشخيص والتوصيات</th></tr></thead><tbody>{data.insights.map((item) => <tr key={item.toolId}><td><strong>{item.name}</strong><small>{item.slug}</small></td><td>{item.views.toLocaleString('en')}</td><td>{item.runs.toLocaleString('en')}</td><td>{item.conversionRate}%</td><td><strong>{item.priority}/100</strong></td><td><span className="status">{issueLabels[item.issue] ?? item.issue}</span><ul>{item.recommendations.map((r) => <li key={r}>{r}</li>)}</ul></td></tr>)}</tbody></table></div>}</>}
    <p className="admin-muted" style={{ marginTop: 12, fontSize: 12 }}>لا يتم استنتاج مرات الظهور أو الإيرادات. التحليل يعتمد على AnalyticsEvent فقط، ويتطلب أن تسجل أحداث الزيارة والتشغيل بأسماء تحتوي view/page وrun/execute/submit. لا تُنشأ تغييرات SEO أو تُنشر تلقائياً.</p>
  </section>;
}
