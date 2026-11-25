import type { MetadataRoute } from 'next';
import { tools, categories } from '@/lib/tool-engine/registry';
import { locales } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/i18n/metadata';
import { landingSlugs } from '@/lib/seo/landing-pages';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const dynamicTools = await prisma.tool.findMany({ where: { status: 'PUBLISHED', indexable: true }, select: { slug: true } });
  const paths = [
    '', '/tools', '/categories', '/templates', '/about', '/privacy-policy', '/terms', '/seo-guides',
    ...categories.map(category => `/categories/${encodeURIComponent(category.toLowerCase())}`),
    ...tools.map(tool => `/tools/${tool.slug}`),
    ...dynamicTools.map(tool => `/tools/${tool.slug}`),
    ...landingSlugs.map(slug => `/use-cases/${slug}`),
  ];
  return locales.flatMap(locale => paths.map(path => {
    const url = `${base}/${locale}${path}`;
    const languages: Record<string, string> = Object.fromEntries(locales.map(other => [other, `${base}/${other}${path}`]));
    languages['x-default'] = `${base}/en${path}`;
    const isHome = path === '';
    const isIndex = path === '/tools' || path === '/categories';
    const isCategory = path.startsWith('/categories/');
    const isLanding = path.startsWith('/use-cases/');
    return {
      url,
      changeFrequency: (isHome || isIndex || isCategory ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
      priority: isHome ? 1 : path === '/tools' ? 0.9 : isCategory ? 0.8 : isLanding ? 0.75 : 0.65,
      alternates: { languages },
    };
  }));
}
