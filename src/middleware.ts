/**
 * Next.js Middleware
 *
 * Handles:
 * - Authentication checks for protected routes
 * - Theme injection for SSR
 * - Request logging
 *
 * IMPORTANT: This middleware uses next-auth/middleware which requires
 * the Edge Runtime. If Edge Runtime causes issues, consider moving
 * auth checks to Server Components or Server Actions.
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Theme injection for SSR
    const theme = req.cookies.get('theme')?.value || 'system';
    const response = NextResponse.next();
    response.headers.set('x-theme', theme);

    // Request logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] ${req.method} ${req.nextUrl.pathname}`);
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // User must be authenticated to access protected routes
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    // Protected routes
    '/dashboard/:path*',
    '/projects/:path*',
    '/tests/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};
