import type { Locale } from '@/lib/i18n';

export type Market = { country: string; countryName: string; locale: Locale; currency: string; searchEngine: string; contentHints: string[] };
export const markets: Market[] = [
  { country: 'US', countryName: 'United States', locale: 'en', currency: 'USD', searchEngine: 'Google', contentHints: ['US spelling', 'local examples', 'US units when relevant'] },
  { country: 'GB', countryName: 'United Kingdom', locale: 'en', currency: 'GBP', searchEngine: 'Google', contentHints: ['British spelling', 'UK examples', 'metric units'] },
  { country: 'CA', countryName: 'Canada', locale: 'en', currency: 'CAD', searchEngine: 'Google', contentHints: ['Canadian spelling where applicable', 'local examples'] },
  { country: 'LY', countryName: 'Libya', locale: 'ar', currency: 'LYD', searchEngine: 'Google', contentHints: ['Arabic terminology', 'Libyan examples', 'local currency'] },
  { country: 'SA', countryName: 'Saudi Arabia', locale: 'ar', currency: 'SAR', searchEngine: 'Google', contentHints: ['Saudi terminology', 'local examples', 'local currency'] },
  { country: 'IN', countryName: 'India', locale: 'hi', currency: 'INR', searchEngine: 'Google', contentHints: ['Indian English usage', 'local examples', 'INR pricing'] },
  { country: 'BD', countryName: 'Bangladesh', locale: 'bn', currency: 'BDT', searchEngine: 'Google', contentHints: ['Bangla localization', 'local examples', 'BDT pricing'] },
];
export function getMarket(countryCode: string) { return markets.find((market) => market.country === countryCode.trim().toUpperCase()) ?? null; }
/** Normalize and group seed keyword ideas; this is not search-volume data. */
export function buildLocalKeywordIdeas(seed: string, market: Market) {
  const cleanSeed = seed.trim();
  if (!cleanSeed) return [];
  const localSuffixes: Record<Locale, string[]> = {
    en: market.country === 'GB' ? ['UK', 'in the UK', 'British'] : market.country === 'CA' ? ['Canada', 'in Canada', 'Canadian'] : ['in ' + market.countryName, market.countryName, 'local'],
    ar: ['في ' + market.countryName, market.countryName, 'محلي'],
    hi: ['में ' + market.countryName, market.countryName, 'स्थानीय'],
    bn: [market.countryName + ' এ', market.countryName, 'স্থানীয়'],
  };
  return [...new Set(localSuffixes[market.locale].map((suffix) => `${cleanSeed} ${suffix}`))].map((keyword) => ({ keyword, country: market.country, locale: market.locale, source: 'seed-expansion' as const, requiresResearch: true }));
}
