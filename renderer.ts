import type { TemplateEntry } from './registry';

export type TemplateFormat = 'md' | 'txt' | 'html' | 'json';

export function extractTemplateVariables(content: string): string[] {
  return [...new Set(Array.from(content.matchAll(/\{\{\s*([a-zA-Z][\w.-]*)\s*\}\}/g), (match) => match[1]))];
}

export function renderTemplate(content: string, values: Record<string, string>, keepMissing = true): string {
  return content.replace(/\{\{\s*([a-zA-Z][\w.-]*)\s*\}\}/g, (_match, key: string) => {
    const value = values[key]?.trim();
    return value || (keepMissing ? `[${key.replace(/[_.-]/g, ' ')}]` : '');
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

export function exportTemplate(template: Pick<TemplateEntry, 'slug' | 'title' | 'category'>, content: string, format: TemplateFormat): { filename: string; mime: string; body: string } {
  if (format === 'json') return { filename: `${template.slug}.json`, mime: 'application/json;charset=utf-8', body: JSON.stringify({ ...template, content }, null, 2) };
  if (format === 'html') return { filename: `${template.slug}.html`, mime: 'text/html;charset=utf-8', body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(template.title)}</title></head><body><main><h1>${escapeHtml(template.title)}</h1><pre style="white-space:pre-wrap;font:inherit">${escapeHtml(content)}</pre></main></body></html>` };
  if (format === 'txt') return { filename: `${template.slug}.txt`, mime: 'text/plain;charset=utf-8', body: content };
  return { filename: `${template.slug}.md`, mime: 'text/markdown;charset=utf-8', body: content };
}
