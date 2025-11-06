/**
 * Next.js Middleware
 *
 * Handles:
 * - Theme injection for SSR
 * - Authentication checks
 * - Request logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/projects',
  '/tests',
  '/settings',
  '/admin',
];

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/projects',
  '/api/tests',
  '/api/users',
  '/api/preferences',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response
  const response = NextResponse.next();

  // 1. Theme Injection for SSR
  const theme = request.cookies.get('theme')?.value || 'system';
  response.headers.set('x-theme', theme);

  // 2. Authentication checks
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  const isProtectedApiRoute = PROTECTED_API_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute || isProtectedApiRoute) {
    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token) {
      if (isProtectedApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Redirect to login for protected pages
      const signInUrl = new URL('/auth/login', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Add user ID to headers for downstream use
    if (token.sub) {
      response.headers.set('x-user-id', token.sub);
    }
  }

  // 3. Request logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${request.method} ${pathname}`);
  }

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