'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { locales, type Locale } from '@/lib/i18n';

const labels: Record<Locale, string> = { en: 'English', ar: 'العربية', hi: 'हिन्दी', bn: 'বাংলা' };
export default function LanguageSwitcher({ current = 'en' }: { current?: Locale }) {
  const pathname = usePathname() || '/';
  const cleanPath = pathname.replace(/^\/(en|ar|hi|bn)(?=\/|$)/, '') || '/';
  return <nav className="language-switcher" aria-label="Choose language">
    {locales.map((locale, index) => <span key={locale}>
      {index > 0 ? <span aria-hidden="true"> · </span> : null}
      <Link href={`/${locale}${cleanPath === '/' ? '' : cleanPath}`} lang={locale} aria-current={current === locale ? 'page' : undefined}>{labels[locale]}</Link>
    </span>)}
  </nav>;
}
