import type { Metadata } from 'next';
import { locales, type Locale } from './index';

/** Returns an absolute site URL; APP_URL must be set to the deployed origin. */
export function getSiteUrl() {
  const configured = process.env.APP_URL?.trim();
  return (configured || 'http://localhost:3000').replace(/\/+$/, '');
}

export function localizedMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  const base = getSiteUrl();
  const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const canonical = `${base}/${locale}${normalizedPath}`;
  const languages = Object.fromEntries(locales.map(code => [code, `${base}/${code}${normalizedPath}`]));
  languages['x-default'] = `${base}/en${normalizedPath}`;
  return {
    title,
    description,
    alternates: { canonical, languages },
    robots: { index: true, follow: true },
    openGraph: { title, description, url: canonical, siteName: 'FreeToolForge', type: 'website', locale },
    twitter: { card: 'summary', title, description },
  };
}
