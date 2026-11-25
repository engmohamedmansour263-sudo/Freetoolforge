import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import './globals.css';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { isLocale, type Locale } from '@/lib/i18n';
export const metadata: Metadata = { title: { default: 'FreeToolForge — Free Online Tools', template: '%s | FreeToolForge' }, description: 'Free, fast online tools for text, SEO, developers, calculations and productivity.', metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'), alternates: { languages: { en: '/en', ar: '/ar', hi: '/hi', bn: '/bn' } } };
export default async function RootLayout({ children }: { children: ReactNode }) {
  const requested = (await headers()).get('x-locale') || 'en';
  const locale: Locale = isLocale(requested) ? requested : 'en';
  return <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}><body><SiteHeader/><main>{children}</main><SiteFooter/></body></html>;
}
