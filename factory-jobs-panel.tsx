'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

type Job = { id: string; status: string; input: unknown; output: unknown; error: string | null; attempts: number; maxAttempts: number; createdAt: string; updatedAt: string; completedAt: string | null; logs: { id: string; level: string; message: string; createdAt: string }[] };
type Filter = 'ALL' | 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
type Metrics = { activeWorkers: number; completedToday: number; failedToday: number; oldestQueuedAt: string | null };
const labels: Record<string, string> = { ALL: 'الكل', QUEUED: 'منتظرة', RUNNING: 'قيد التنفيذ', SUCCEEDED: 'مكتملة', FAILED: 'فاشلة', CANCELLED: 'ملغاة' };

export default function FactoryJobsPanel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [notice, setNotice] = useState('');
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/factory/jobs?take=100${filter === 'ALL' ? '' : `&status=${filter}`}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر تحميل المهام');
      setJobs(data.jobs as Job[]); setError('');
      const metricsResponse = await fetch('/api/admin/factory/metrics', { cache: 'no-store' });
      if (metricsResponse.ok) setMetrics(await metricsResponse.json() as Metrics);
    } catch (e) { setError(e instanceof Error ? e.message : 'حدث خطأ'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 10000); return () => window.clearInterval(timer); }, [refresh]);

  const counts = useMemo(() => jobs.reduce<Record<string, number>>((acc, job) => { acc[job.status] = (acc[job.status] || 0) + 1; return acc; }, {}), [jobs]);
  async function createJob(event: FormEvent) {
    event.preventDefault(); setBusy('create'); setNotice('');
    try {
      const response = await fetch('/api/admin/factory/jobs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keyword, source: 'admin-dashboard', idempotencyKey: `admin-${crypto.randomUUID()}` }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'تعذر إنشاء المهمة');
      setKeyword(''); setNotice('تمت إضافة المهمة إلى قائمة الانتظار.'); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'حدث خطأ'); }
    finally { setBusy(null); }
  }
  async function runOne() {
    setBusy('worker'); setNotice('');
    try { const response = await fetch('/api/admin/factory/worker', { method: 'POST' }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'تعذر تشغيل العامل'); setNotice(data.processed ? 'عالج العامل مهمة واحدة.' : 'لا توجد مهمة جاهزة حالياً.'); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'حدث خطأ'); } finally { setBusy(null); }
  }
  async function act(id: string, action: 'retry' | 'cancel') {
    setBusy(id); setNotice('');
    try {
      const response = await fetch(`/api/admin/factory/jobs/${id}/action`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'تعذر تنفيذ الإجراء');
      setNotice(action === 'retry' ? 'أعيدت المهمة إلى قائمة الانتظار.' : 'ألغيت المهمة.'); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'حدث خطأ'); }
    finally { setBusy(null); }
  }

  return <section className="admin-panel" style={{ marginTop: 24 }} dir="rtl">
    <div className="admin-section-head"><div><h2>مصنع الأدوات المستقل</h2><p className="admin-muted">مراقبة الوظائف وتدفق التنفيذ — تحديث تلقائي كل 10 ثوانٍ</p></div><div style={{ display: 'flex', gap: 8 }}><button className="admin-button" onClick={() => void runOne()} disabled={busy === 'worker'}>{busy === 'worker' ? 'جارٍ التشغيل...' : 'تشغيل مهمة واحدة'}</button><button className="admin-button" onClick={() => void refresh()} disabled={loading}>تحديث الآن</button></div></div>
    <form onSubmit={createJob} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}><input aria-label="الكلمة المفتاحية" value={keyword} onChange={e => setKeyword(e.target.value)} minLength={2} maxLength={200} required placeholder="أدخل فكرة الأداة أو الكلمة المفتاحية" style={{ flex: '1 1 260px', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}/><button className="admin-button" disabled={busy === 'create' || keyword.trim().length < 2}>{busy === 'create' ? 'جارٍ الإضافة...' : 'إضافة مهمة'}</button></form>
    {metrics && <div className="admin-stats" style={{ margin: '12px 0' }}><article className="admin-stat"><span>Workers نشطون</span><strong>{metrics.activeWorkers}</strong></article><article className="admin-stat"><span>نجاح اليوم</span><strong>{metrics.completedToday}</strong></article><article className="admin-stat"><span>فشل اليوم</span><strong>{metrics.failedToday}</strong></article><article className="admin-stat"><span>أقدم انتظار</span><strong style={{ fontSize: 13 }}>{metrics.oldestQueuedAt ? new Date(metrics.oldestQueuedAt).toLocaleTimeString('ar') : '—'}</strong></article></div>}
    <div className="admin-stats" style={{ margin: '12px 0' }}>{(['QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED'] as const).map(status => <article className="admin-stat" key={status}><span>{labels[status]}</span><strong>{counts[status] || 0}</strong></article>)}</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>{(['ALL','QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED'] as Filter[]).map(value => <button key={value} className="admin-button" aria-pressed={filter === value} onClick={() => setFilter(value)} style={{ opacity: filter === value ? 1 : .65 }}>{labels[value]}</button>)}</div>
    {error && <p role="alert" className="admin-error">{error}</p>}{notice && <p role="status" className="admin-muted">{notice}</p>}
    {loading ? <p className="admin-muted">جارٍ تحميل المهام...</p> : jobs.length === 0 ? <p className="admin-muted">لا توجد مهام في هذا التصنيف.</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>الفكرة</th><th>الحالة</th><th>المحاولات</th><th>تاريخ الإنشاء</th><th>الإجراءات</th></tr></thead><tbody>{jobs.map(job => { const input = job.input as { keyword?: string }; return <tr key={job.id}><td><strong>{input?.keyword || 'مهمة مصنع'}</strong><small>{job.id}</small>{job.error && <small style={{ color: 'var(--danger, #b42318)' }}>{job.error}</small>}</td><td><span className={`status status-${job.status.toLowerCase()}`}>{labels[job.status] || job.status}</span></td><td>{job.attempts}/{job.maxAttempts}</td><td>{new Date(job.createdAt).toLocaleString('ar')}</td><td style={{ whiteSpace: 'nowrap' }}>{job.status === 'QUEUED' && <button className="admin-button" disabled={busy === job.id} onClick={() => void act(job.id, 'cancel')}>إلغاء</button>}{['FAILED','CANCELLED'].includes(job.status) && <button className="admin-button" disabled={busy === job.id} onClick={() => void act(job.id, 'retry')}>إعادة المحاولة</button>}</td></tr>; })}</tbody></table></div>}
    <p className="admin-footnote">تُعرض أحدث 100 مهمة. لا يتم نشر الأدوات تلقائياً؛ النتائج المقبولة تبقى بانتظار المراجعة البشرية.</p>
  </section>;
}
