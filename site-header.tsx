import Link from 'next/link';
import { headers } from 'next/headers';
import LanguageSwitcher from '@/components/language-switcher';
import { getMessages, isLocale, type Locale } from '@/lib/i18n';
export default async function SiteHeader() {
  const raw = (await headers()).get('x-locale') || 'en';
  const t = getMessages(isLocale(raw) ? raw : 'en');
  return <header className="header"><div className="container header-inner"><Link href="/" className="brand"><span className="brand-mark">✦</span> FreeToolForge</Link><nav><Link href="/tools">{t.nav.tools}</Link><Link href="/categories">{t.nav.categories}</Link><Link href="/templates">{t.nav.templates}</Link><Link href="/pricing">{raw === 'ar' ? 'الأسعار' : 'Pricing'}</Link><Link href="/workspace">{raw === 'ar' ? 'ملفاتي' : 'My files'}</Link><Link href="/about">{t.nav.about}</Link></nav><div className="header-actions"><LanguageSwitcher current={(isLocale(raw) ? raw : 'en') as Locale}/><Link href="/tools" className="btn header-cta">{t.nav.explore} ↗</Link></div></div></header>;
}
