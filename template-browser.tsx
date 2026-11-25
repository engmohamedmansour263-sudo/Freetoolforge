'use client';

import { useEffect, useMemo, useState } from 'react';
import { templates as builtInTemplates, type TemplateEntry } from '@/lib/tool-templates/registry';
import { exportTemplate, extractTemplateVariables, renderTemplate, type TemplateFormat } from '@/lib/tool-templates/renderer';
import type { Locale } from '@/lib/i18n'; import { localizeTemplate } from '@/lib/i18n/content'; import { getUI } from '@/lib/i18n/ui'; import { localizeCategory } from '@/lib/i18n/content';

const STORAGE_KEY = 'free-tool-forge-custom-templates-v1';
type SavedTemplate = TemplateEntry & { updatedAt: string };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `custom-${Date.now()}`;
}

export default function TemplateBrowser({ locale = 'en' }: { locale?: Locale }) {
  const t = getUI(locale).templates;
  const [custom, setCustom] = useState<SavedTemplate[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState(builtInTemplates[0]?.slug ?? '');
  const [values, setValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState('Custom');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedTemplate[];
        if (Array.isArray(parsed)) setCustom(parsed.filter((item) => item && typeof item.slug === 'string' && typeof item.content === 'string'));
      }
    } catch { setNotice(t.loaded); }
    finally { setHydrated(true); }
  }, [t.loaded]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(custom)); }
    catch { setNotice(t.full); }
  }, [custom, hydrated, t.full]);

  const allTemplates = useMemo(() => [...builtInTemplates.map(item => localizeTemplate(item, locale)), ...custom], [custom, locale]);
  const template = allTemplates.find((item) => item.slug === selected) ?? allTemplates[0];
  const variables = useMemo(() => template ? extractTemplateVariables(template.content) : [], [template]);
  const result = useMemo(() => template ? renderTemplate(template.content, values) : '', [template, values]);

  function startNew() {
    setEditingSlug(null);
    setDraftTitle(t.new); setDraftCategory('Custom'); setDraftDescription('A reusable custom template.');
    setDraftContent('# {{title}}\n\nAdd your content here.'); setEditing(true);
  }

  function startEdit() {
    if (!template || builtInTemplates.some((item) => item.slug === template.slug)) return;
    setEditingSlug(template.slug);
    setDraftTitle(template.title); setDraftCategory(template.category); setDraftDescription(template.description);
    setDraftContent(template.content); setEditing(true);
  }

  function saveDraft() {
    const title = draftTitle.trim();
    if (title.length < 2 || draftContent.trim().length < 3) { setNotice(t.bad); return; }
    const existing = editingSlug ? custom.find((item) => item.slug === editingSlug) : undefined;
    let slug = existing?.slug ?? slugify(title);
    if (!existing && (builtInTemplates.some((item) => item.slug === slug) || custom.some((item) => item.slug === slug))) slug = `${slug}-${Date.now().toString(36)}`;
    const entry: SavedTemplate = { slug, title, category: draftCategory.trim() || 'Custom', description: draftDescription.trim() || 'Custom template', content: draftContent, variables: extractTemplateVariables(draftContent), updatedAt: new Date().toISOString() };
    setCustom((items) => existing ? items.map((item) => item.slug === slug ? entry : item) : [...items, entry]);
    setSelected(slug); setValues({}); setEditing(false); setEditingSlug(null); setNotice(t.saved);
  }

  function download(format: TemplateFormat) {
    if (!template) return;
    const file = exportTemplate(template, result, format);
    const blob = new Blob([file.body], { type: file.mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.filename;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  }

  async function copyResult() {
    try { await navigator.clipboard.writeText(result); setNotice(t.copied); }
    catch { setNotice(t.blocked); }
  }

  function deleteCustom() {
    if (!template || !custom.some((item) => item.slug === template.slug)) return;
    setCustom((items) => items.filter((item) => item.slug !== template.slug));
    setSelected(builtInTemplates[0]?.slug ?? ''); setValues({}); setNotice(t.deleted);
  }

  if (!template) return <p>{t.empty}</p>;

  return <div className="template-layout">
    <aside className="template-list panel">
      <button className="btn" onClick={startNew}>{t.create}</button>
      <p className="muted">{t.library}</p>
      {allTemplates.map((item) => <button key={item.slug} className={`template-option ${selected === item.slug ? 'selected' : ''}`} onClick={() => { setSelected(item.slug); setValues({}); setEditing(false); }}>
        <span className="tool-category">{localizeCategory(item.category,locale)}</span><b>{item.title}</b><small>{item.description}</small>
      </button>)}
    </aside>
    <div className="template-editor panel">
      {editing ? <>
        <div className="template-editor-top"><div><h2>{custom.some((item) => item.slug === selected) ? t.edit : t.createTitle}</h2><p className="muted">{t.hint}</p></div></div>
        <div className="template-fields">
          <label className="field-label">{t.name}<input className="field" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} /></label>
          <label className="field-label">{t.category}<input className="field" value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)} /></label>
          <label className="field-label">{t.description}<input className="field" value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} /></label>
          <label className="field-label">{t.content}<textarea className="field template-input" rows={14} value={draftContent} onChange={(event) => setDraftContent(event.target.value)} /></label>
          <p className="muted">{t.detected}: {extractTemplateVariables(draftContent).join(', ') || t.none}</p>
        </div>
        <div className="template-preview"><div className="output-head"><b>{t.preview}</b><span className="muted">{locale === 'ar' ? 'معاينة مباشرة باستخدام قيم نموذجية' : 'Live preview with sample values'}</span></div><pre className="output">{renderTemplate(draftContent, Object.fromEntries(extractTemplateVariables(draftContent).map((variable) => [variable, `Sample ${variable.replace(/[_.-]/g, ' ')}`])), false)}</pre></div>
        <div className="actions"><button className="btn" onClick={saveDraft}>{t.save}</button><button className="btn secondary" onClick={() => setEditing(false)}>{t.cancel}</button></div>
      </> : <>
        <div className="template-editor-top"><div><h2>{template.title}</h2><p className="muted">{t.fill}</p></div>
          <div className="actions"><button className="btn secondary" onClick={copyResult}>{t.copy}</button>
            <select className="field" aria-label={t.format} defaultValue="md" onChange={(event) => download(event.target.value as TemplateFormat)}><option value="md">{t.md}</option><option value="txt">{t.txt}</option><option value="html">{t.html}</option><option value="json">{t.json}</option></select>
          </div>
        </div>
        <div className="template-fields">{variables.map((variable) => <label className="field-label" key={variable}>{variable.replace(/[_.-]/g, ' ')}<textarea className="field template-input" value={values[variable] || ''} onChange={(event) => setValues((old) => ({ ...old, [variable]: event.target.value }))} placeholder={`${locale==='ar'?'أدخل':locale==='hi'?'दर्ज करें':locale==='bn'?'লিখুন':'Enter'} ${variable.replace(/[_.-]/g, ' ')}…`} rows={2} /></label>)}</div>
        <div className="template-preview"><div className="output-head"><b>{t.preview}</b><span className="muted">{locale==='ar'?'تظهر المتغيرات غير المعبأة بين أقواس مربعة':locale==='hi'?'खाली वेरिएबल वर्ग कोष्ठक में दिखेंगे':locale==='bn'?'খালি ভেরিয়েবল বর্গ বন্ধনীতে দেখানো হবে':'Unfilled variables appear in brackets'}</span></div><pre className="output">{result}</pre></div>
        <div className="actions">{custom.some((item) => item.slug === template.slug) && <><button className="btn secondary" onClick={startEdit}>{t.edit}</button><button className="btn secondary" onClick={deleteCustom}>{t.delete}</button></>}</div>
      </>}
      {notice && <p className="muted" role="status">{notice}</p>}
    </div>
  </div>;
}
