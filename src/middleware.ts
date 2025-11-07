import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'never', // Don't add locale prefix to URLs
});

export default function middleware(request: NextRequest) {
  // Run next-intl middleware
  const response = intlMiddleware(request);

  // Add custom headers if needed
  const theme = request.cookies.get('theme')?.value || 'system';
  response.headers.set('x-theme', theme);

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
