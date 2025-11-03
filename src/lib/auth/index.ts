/**
 * Authentication Utilities
 *
 * Server-side authentication helpers for Next.js App Router.
 * Provides session management and auth checks.
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from './config';
import { redirect } from 'next/navigation';
import { cache } from 'react';

/**
 * Get the current user session (cached per request)
 */
export const getSession = cache(async () => {
  return await getServerSession(authOptions);
});

/**
 * Get the current user or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Require authentication or redirect to login
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

/**
 * Require specific role or redirect
 */
export async function requireRole(role: string) {
  const session = await requireAuth();

  if (session.user.role !== role) {
    redirect('/unauthorized');
  }

  return session;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: string) {
  const session = await getSession();
  return session?.user?.role === role;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}