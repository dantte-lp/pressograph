/**
 * Next.js 16 Proxy (replaces middleware.ts)
 *
 * ⚠️ IMPORTANT LIMITATION: Edge Runtime is NOT supported in proxy.ts
 * This means next-auth/jwt's getToken() cannot be used here.
 *
 * Current approach: Simplified proxy without auth checks
 * Auth is handled at:
 * - Server Components (checking session in layout/page)
 * - Route Handlers (API routes checking auth)
 * - Server Actions (auth checks in actions)
 *
 * Handles:
 * - Setup flow redirection
 * - Internationalization (next-intl)
 * - Theme injection for SSR
 * - Request logging
 *
 * TODO: This is a temporary solution until Next.js provides
 * proper Edge Runtime support in proxy or alternative auth APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, type Locale } from './i18n/config';

/**
 * Routes that should be accessible even during setup
 */
const setupAllowedRoutes = [
  "/setup",
  "/api/setup/status",
  "/api/setup/init",
  "/offline",
  "/_next",
  "/favicon.ico",
  "/manifest.json",
  "/sw.js",
  "/workbox-",
];

/**
 * Check if route is allowed during setup
 */
function isSetupAllowedRoute(pathname: string): boolean {
  return setupAllowedRoutes.some((route) => {
    if (pathname === route) return true;
    if (pathname.startsWith(route)) return true;
    return false;
  });
}

/**
 * Check if setup is required by directly checking the database
 * This avoids infinite loops by not calling the API from middleware
 */
async function checkSetupStatus(): Promise<boolean> {
  try {
    // Import setup check directly to avoid circular dependency
    const { isSetupRequired } = await import("@/lib/db/setup");
    return await isSetupRequired();
  } catch (error) {
    console.error("[Proxy] Setup status check error:", error);
    return false; // Assume setup complete on error
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Setup Flow Handling
  // Allow setup routes always
  if (isSetupAllowedRoute(pathname)) {
    // Continue to i18n and theme handling
  } else {
    // Check if setup required (direct database check to avoid loops)
    const setupRequired = await checkSetupStatus();

    // Redirect to setup if needed
    if (setupRequired && pathname !== "/setup") {
      return NextResponse.redirect(new URL("/setup", request.url));
    }

    // Redirect to signin if setup complete but accessing setup
    if (!setupRequired && pathname === "/setup") {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  // Create response
  let response = NextResponse.next();

  // 2. Internationalization (i18n)
  // Get locale from cookie or use default
  const localeCookie = request.cookies.get('locale');
  const locale = (localeCookie?.value as Locale) || defaultLocale;

  // Set locale cookie if not present
  if (!localeCookie) {
    response.cookies.set('locale', locale, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
    });
  }

  // Set locale header for next-intl
  response.headers.set('x-next-intl-locale', locale);

  // 3. Theme Injection for SSR
  const theme = request.cookies.get('theme')?.value || 'system';
  response.headers.set('x-theme', theme);

  // 4. Request logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Proxy] ${request.method} ${pathname} [locale: ${locale}]`);
  }

  // Note: Authentication checks have been moved to:
  // - Server Components (via getServerSession)
  // - API routes (via route handler auth checks)
  // - Server Actions (via action auth checks)

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
