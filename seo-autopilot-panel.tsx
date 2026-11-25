'use client';
import { useCallback, useEffect, useState } from 'react';

type Opportunity = {
  id: string; keyword: string; impressions: number; clicks: number; position: number | null;
  status: string; priority: number; ctr: number; opportunityType: string; recommendation: string;
  suggestedSlug: string | null; source: string; notes: string | null;
};
type Stats = { total: number; ready: number; candidates: number; review: number };

const statusLabel: Record<string, string> = {
  DISCOVERED: 'مكتشفة', READY_TO_GENERATE: 'جاهزة لتوليد مرشح', CANDIDATE_CREATED: 'مرشح بانتظار المراجعة',
  REVIEW_REQUIRED: 'تحتاج مراجعة هندسية', PUBLISHED: 'منشورة',
};
const typeLabel: Record<string, string> = {
  low_ctr: 'ظهور مع CTR منخفض', striking_distance: 'قريبة من الصفحة الأولى',
  low_visibility: 'ظهور محدود', no_clicks: 'ظهور بلا نقرات', insufficient_data: 'بيانات غير كافية',
};

export default function SEOAutopilotPanel() {
  const [keywords, setKeywords] = useState('');
  const [source, setSource] = useState('manual');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [connection, setConnection] = useState<{configured:boolean;siteUrl:string|null}|null>(null);
  const [importedSignals, setImportedSignals] = useState<Array<{keyword:string;impressions:number;clicks:number;position:number}>>([]);
  const [stats, setStats] = useState<{received:number;existingTools:number;opportunities:number;candidates:number;readyToGenerate:number;reviewRequired:number;duplicates:number;lowCtr:number;strikingDistance:number}|null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [summary, setSummary] = useState<Stats>({ total: 0, ready: 0, candidates: 0, review: 0 });
  const [filter, setFilter] = useState('all');
  const [factoryBusyId, setFactoryBusyId] = useState<string | null>(null);

  const loadOpportunities = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/seo-autopilot/discover', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      setOpportunities(data.opportunities ?? []);
      setSummary(data.stats ?? { total: 0, ready: 0, candidates: 0, review: 0 });
    } catch { /* Keep the admin screen usable if the list endpoint is temporarily unavailable. */ }
  }, []);
  useEffect(() => { void loadOpportunities(); }, [loadOpportunities]);

  async function importSearchConsole() {
    setBusy(true); setMessage('جارٍ جلب وتحليل بيانات Google Search Console وحفظ الفرص…');
    try {
      const response = await fetch('/api/admin/seo-autopilot/search-console/import', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر استيراد بيانات Search Console.');
      setImportedSignals([]);
      setKeywords('');
      setSource('search-console');
      setConnection({ configured: true, siteUrl: data.siteUrl });
      setStats({ received: data.fetched, existingTools: 0, opportunities: Math.max(0, data.processed - data.unsupported), candidates: 0,
        readyToGenerate: data.ready, reviewRequired: data.review, duplicates: 0, lowCtr: 0, strikingDistance: 0 });
      setMessage(`اكتملت المزامنة: ${data.processed} كلمة من ${data.startDate} إلى ${data.endDate}. جاهزة للتوليد: ${data.ready}، وتحتاج مراجعة: ${data.review}.`);
      await loadOpportunities();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'); }
    finally { setBusy(false); }
  }

  async function generateCandidate(opportunityId: string) {
    setFactoryBusyId(opportunityId); setMessage('جارٍ بناء الأداة وتشغيل اختبارات الجودة…');
    try {
      const response = await fetch('/api/admin/seo-autopilot/factory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opportunityId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر إنشاء مرشح الأداة.');
      setMessage(`${data.message} درجة الجودة: ${data.quality.score}/100.`);
      await loadOpportunities();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'); }
    finally { setFactoryBusyId(null); }
  }

  async function discover() {
    const list = importedSignals.length && keywords.trim() === importedSignals.map(row => row.keyword).join('\n')
      ? importedSignals
      : keywords.split('\n').map(v => v.trim()).filter(Boolean).map(keyword => ({ keyword }));
    if (!list.length) { setMessage('أدخل كلمة مفتاحية واحدة على الأقل.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/seo-autopilot/discover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source, keywords: list }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر تحليل الكلمات.');
      setStats(data); setMessage(data.message); await loadOpportunities();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'); }
    finally { setBusy(false); }
  }

  const visible = opportunities.filter(item => filter === 'all' || item.status === filter);
  return <section className="admin-panel" style={{ marginTop: 24 }}>
    <div className="admin-section-head"><div><h2>مركز ذكاء FreeToolForge · المرحلتان 12 و13</h2><p className="admin-muted">اكتشاف فجوات البحث، ترتيب الفرص، وبناء مرشحات أدوات موثوقة مع اختبارات جودة قبل مراجعتها. استيراد Search Console يعالج جميع الصفحات المسترجعة على دفعات محفوظة.</p></div></div>
    <div className="admin-stats" style={{ marginTop: 16 }}>
      {([['إجمالي الفرص',summary.total],['جاهزة للتوليد',summary.ready],['مرشحات للمراجعة',summary.candidates],['تحتاج مراجعة هندسية',summary.review]] as const).map(([label,value])=><article className="admin-stat" key={label}><span>{label}</span><strong>{value}</strong></article>)}
    </div>
    <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',margin:'16px 0'}}>
      <button type="button" disabled={busy} onClick={importSearchConsole} className="button button-secondary">{busy?'جارٍ الاتصال…':'جلب الكلمات من Google Search Console'}</button>
      {connection && <span className="admin-muted">{connection.configured ? `الإعداد جاهز: ${connection.siteUrl}` : 'غير متصل'}</span>}
    </div>
    <label htmlFor="seo-source">مصدر الكلمات</label>
    <select id="seo-source" value={source} onChange={e=>setSource(e.target.value)}><option value="manual">إدخال يدوي</option><option value="search-console">Google Search Console (استيراد)</option><option value="analytics">Analytics</option></select>
    <label htmlFor="seo-keywords">كلمة مفتاحية في كل سطر (حتى 500)</label>
    <textarea id="seo-keywords" rows={6} value={keywords} onChange={e=>{setKeywords(e.target.value);setImportedSignals([]);}} placeholder={'مثال:\nJSON Formatter\nDiscount Calculator\nKeyword Density Checker'} style={{ width:'100%', marginTop:8 }} />
    <button type="button" disabled={busy} onClick={discover} className="button button-primary" style={{ marginTop:12 }}>{busy?'جارٍ التحليل…':'تحليل الكلمات واكتشاف الفرص'}</button>
    {stats && <div className="admin-stats" style={{ marginTop:16 }}>{([['الكلمات المستلمة',stats.received],['موجودة مسبقًا',stats.existingTools],['فرص مكتشفة',stats.opportunities],['جاهزة لمصنع الأدوات',stats.readyToGenerate],['مرشحات منشأة',stats.candidates],['تحتاج مراجعة',stats.reviewRequired],['مكررة',stats.duplicates],['CTR منخفض/بلا نقرات',stats.lowCtr],['قريبة من الصفحة الأولى',stats.strikingDistance]] as const).map(([label,value])=><article className="admin-stat" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>}
    {message && <p role="status" className="admin-muted" style={{ marginTop:12 }}>{message}</p>}

    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginTop:28}}>
      <div><h3 style={{marginBottom:4}}>فرص البحث ذات الأولوية</h3><p className="admin-muted">الدرجة مؤشر داخلي تقريبي وليست توقعاً لحجم البحث أو ضماناً للترتيب.</p></div>
      <select aria-label="تصفية الفرص" value={filter} onChange={e=>setFilter(e.target.value)}>
        <option value="all">كل الحالات</option><option value="READY_TO_GENERATE">جاهزة للتوليد</option><option value="CANDIDATE_CREATED">مرشحات للمراجعة</option><option value="REVIEW_REQUIRED">مراجعة هندسية</option>
      </select>
    </div>
    <div style={{display:'grid',gap:10,marginTop:12}}>
      {visible.length === 0 ? <p className="admin-muted">لا توجد فرص في هذا التصنيف بعد. استورد بيانات Search Console أو أدخل كلمات مفتاحية.</p> : visible.map(item=><article key={item.id} style={{border:'1px solid var(--border, #ddd)',borderRadius:12,padding:14}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
          <div><strong>{item.keyword}</strong><div className="admin-muted" style={{fontSize:13,marginTop:4}}>{typeLabel[item.opportunityType] ?? item.opportunityType} · {statusLabel[item.status] ?? item.status}</div></div>
          <div style={{textAlign:'end'}}><strong>{item.priority}/100</strong><div className="admin-muted" style={{fontSize:12}}>الأولوية</div></div>
        </div>
        <div className="admin-muted" style={{display:'flex',gap:14,flexWrap:'wrap',fontSize:13,marginTop:10}}>
          <span>الظهور: {item.impressions.toLocaleString()}</span><span>النقرات: {item.clicks.toLocaleString()}</span><span>CTR: {item.ctr}%</span><span>متوسط الموضع: {item.position ?? '—'}</span>
        </div>
        <p style={{fontSize:13,margin:'10px 0 0'}}>{item.recommendation}</p>
        {item.suggestedSlug && <p className="admin-muted" style={{fontSize:12,margin:'6px 0 0'}}>المعرّف المقترح: {item.suggestedSlug}</p>}
        {item.status === 'READY_TO_GENERATE' && <button type="button" className="button button-primary" disabled={busy || factoryBusyId !== null} onClick={() => generateCandidate(item.id)} style={{marginTop:12}}>{factoryBusyId === item.id ? 'جارٍ إنشاء الأداة واختبارها…' : 'إنشاء مرشح الأداة واختباره'}</button>}
        {item.status === 'CANDIDATE_CREATED' && <p className="admin-muted" style={{fontSize:12,margin:'8px 0 0'}}>تم إنشاء المرشح؛ ينتظر مراجعة الإدارة ولا يزال غير منشور.</p>}
      </article>)}
    </div>
    <p className="admin-footnote" style={{marginTop:16}}>الأدوات التي ينشئها المحرك تحفظ بحالة REVIEW و indexable=false، ولا تُنشر أو تُفهرس تلقائياً. اختبار التشغيل الأولي لا يغني عن مراجعة جودة الوظيفة والواجهة واللغة والخصوصية وSEO. استيراد Search Console يجلب آخر 28 يوماً مكتملاً مع استبعاد آخر 3 أيام.</p>
  </section>;
}
