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
 * - Theme injection for SSR
 * - Request logging
 *
 * TODO: This is a temporary solution until Next.js provides
 * proper Edge Runtime support in proxy or alternative auth APIs
 */

import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response
  const response = NextResponse.next();

  // 1. Theme Injection for SSR
  const theme = request.cookies.get('theme')?.value || 'system';
  response.headers.set('x-theme', theme);

  // 2. Request logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Proxy] ${request.method} ${pathname}`);
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
