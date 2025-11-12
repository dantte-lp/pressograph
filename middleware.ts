/**
 * Next.js Middleware
 *
 * Handles:
 * 1. Internationalization (next-intl)
 * 2. Public routes that bypass authentication
 * 3. NextAuth.js integration
 *
 * Order of execution:
 * 1. Check if route is public
 * 2. Apply i18n middleware for locale detection
 */

import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './src/i18n/config';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/auth/verify',
  '/privacy',
  '/terms',
  '/api/auth',
  '/share', // Public share links
];

// Routes that should bypass i18n middleware
const i18nExemptRoutes = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
];

/**
 * Check if route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  });
}

/**
 * Check if route should bypass i18n middleware
 */
function isI18nExempt(pathname: string): boolean {
  return i18nExemptRoutes.some((route) => pathname.startsWith(route));
}

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeDetection: false, // We handle this via cookies in the app
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for exempt routes
  if (isI18nExempt(pathname)) {
    return NextResponse.next();
  }

  // Apply i18n middleware
  const response = intlMiddleware(request);

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  // Match all pathnames except for:
  // - API routes (handled by Next.js)
  // - Static files
  // - Image optimization files
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
