import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, isLocale } from './lib/i18n';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split('/');
  const first = segments[1] || '';
  if (isLocale(first)) {
    const internalPath = '/' + segments.slice(2).join('/');
    const url = request.nextUrl.clone();
    url.pathname = internalPath === '/' ? '/' : internalPath;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', first);
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    response.cookies.set('ftf-locale', first, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
    return response;
  }
  const cookieLocale = request.cookies.get('ftf-locale')?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  if (locale !== defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);
  return NextResponse.next({ request: { headers: requestHeaders } });
}
export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'] };
