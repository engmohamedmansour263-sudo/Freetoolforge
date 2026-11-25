'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Candidate = {
  id: string; keyword: string; score: number; status: string; source: string;
  analysis: { recommendation?: string; competitionLevel?: string; blueprintSupported?: boolean; demandScore?: number; gapScore?: number };
  updatedAt: string;
};
type Report = { top20: Candidate[]; counts: { status: string; count: number }[] };

const labels: Record<string, string> = { DISCOVERED: 'مكتشفة', QUEUED: 'في قائمة التصنيع', REVIEWED: 'تمت المراجعة', REJECTED: 'مرفوضة' };

export default function DiscoveryDashboard() {
  const [report, setReport] = useState<Report | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const query = status === 'ALL' ? '' : `?status=${encodeURIComponent(status)}`;
      const [reportResponse, listResponse] = await Promise.all([
        fetch('/api/admin/discovery/report', { cache: 'no-store' }),
        fetch(`/api/admin/discovery/candidates${query}`, { cache: 'no-store' }),
      ]);
      if (!reportResponse.ok || !listResponse.ok) throw new Error('تعذر تحميل بيانات الاكتشاف');
      const [reportData, listData] = await Promise.all([reportResponse.json(), listResponse.json()]);
      setReport(reportData); setCandidates(listData.candidates ?? []); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'حدث خطأ'); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { void refresh(); }, [refresh]);

  const totals = useMemo(() => (report?.counts ?? []).reduce<Record<string, number>>((acc, row) => { acc[row.status] = row.count; return acc; }, {}), [report]);

  async function queueCandidate(candidate: Candidate) {
    setBusyId(candidate.id); setMessage('');
    try {
      const response = await fetch(`/api/admin/discovery/candidates/${candidate.id}/queue`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'تعذر إرسال الفرصة');
      setMessage(`تم إرسال «${candidate.keyword}» إلى المصنع. رقم المهمة: ${data.jobId}`);
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'حدث خطأ'); }
    finally { setBusyId(null); }
  }

  return <section className="admin-panel" style={{ marginTop: 24 }}>
    <div className="admin-section-head"><div><h2>ذكاء فرص الأدوات</h2><p className="admin-muted">ترتيب الفرص ومراجعة المنافسة وإرسال الفرص المدعومة إلى مصنع الأدوات.</p></div><button className="btn secondary" onClick={() => void refresh()} disabled={loading}>{loading ? 'جارٍ التحديث…' : 'تحديث البيانات'}</button></div>
    <div className="admin-stats" style={{ margin: '16px 0' }}>
      {[['كل الفرص', Object.values(totals).reduce((a, b) => a + b, 0)], ['مكتشفة', totals.DISCOVERED ?? 0], ['في قائمة التصنيع', totals.QUEUED ?? 0], ['أفضل نتيجة', report?.top20?.[0]?.score ?? 0]].map(([label, value]) => <article className="admin-stat" key={label}><span>{label}</span><strong>{Number(value).toLocaleString('en')}</strong></article>)}
    </div>
    <div className="admin-section-head"><h3>الفرص المرشحة</h3><select aria-label="تصفية الحالة" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">كل الحالات</option><option value="DISCOVERED">مكتشفة</option><option value="QUEUED">في قائمة التصنيع</option><option value="REVIEWED">تمت المراجعة</option><option value="REJECTED">مرفوضة</option></select></div>
    {message && <p role="status" className="admin-muted" style={{ padding: 10, background: 'var(--surface-secondary, #f3f4f6)', borderRadius: 8 }}>{message}</p>}
    {loading ? <p className="admin-muted">جارٍ تحميل الفرص…</p> : candidates.length === 0 ? <p className="admin-muted">لا توجد فرص في هذه القائمة بعد. ابدأ باستيراد بيانات Search Console أو أضف إشارات بحث.</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>الكلمة المفتاحية</th><th>النتيجة</th><th>المنافسة</th><th>الحالة</th><th>التوصية</th><th>الإجراء</th></tr></thead><tbody>{candidates.map((candidate) => <tr key={candidate.id}><td><strong>{candidate.keyword}</strong><small>{candidate.source}</small></td><td><strong>{candidate.score}/100</strong></td><td>{candidate.analysis?.competitionLevel ?? 'غير محدد'}</td><td><span className={`status status-${candidate.status.toLowerCase()}`}>{labels[candidate.status] ?? candidate.status}</span></td><td>{candidate.analysis?.recommendation ?? '—'}</td><td>{candidate.status === 'DISCOVERED' && candidate.analysis?.blueprintSupported ? <button className="btn secondary" disabled={busyId === candidate.id} onClick={() => void queueCandidate(candidate)}>{busyId === candidate.id ? 'جارٍ الإرسال…' : 'إرسال للمصنع'}</button> : <span className="admin-muted">—</span>}</td></tr>)}</tbody></table></div>}
    <p className="admin-muted" style={{ marginTop: 12, fontSize: 12 }}>الدرجات أدوات ترتيب وليست توقعات أرباح. بيانات المنافسين تعتمد على مصادر موثقة تُدخلها أو تربطها؛ لا يتم اختلاق نتائج بحث.</p>
  </section>;
}
