/**
 * Server-Side Authentication Utilities
 *
 * Since Next.js 16 proxy.ts doesn't support Edge Runtime,
 * authentication checks are handled in Server Components and Route Handlers.
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/config';

/**
 * Get the current user session
 * Returns null if not authenticated
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Require authentication for a page
 * Redirects to login if not authenticated
 */
export async function requireAuth(callbackUrl?: string) {
  const session = await getSession();

  if (!session?.user) {
    const url = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/login';
    redirect(url as any); // Type cast needed until /login route is created
  }

  return session;
}

/**
 * Require admin role
 * Redirects to unauthorized page if not admin
 */
export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== 'admin') {
    redirect('/unauthorized' as any); // Type cast needed until /unauthorized route is created
  }

  return session;
}

/**
 * Check if user is authenticated (without redirect)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Check if user is admin (without redirect)
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === 'admin';
}

/**
 * Get current user ID
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}

/**
 * Protected routes configuration
 * Used in layouts to check auth requirements
 */
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/projects',
  '/tests',
  '/profile',
  '/settings',
  '/admin',
] as const;

export const ADMIN_ROUTES = ['/admin'] as const;

/**
 * Check if a path requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a path requires admin role
 */
export function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}
