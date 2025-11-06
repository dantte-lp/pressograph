/**
 * Dashboard Layout Route
 *
 * This layout wraps all dashboard-related pages (/dashboard, /projects, /tests, etc.)
 * with the sidebar navigation and header.
 *
 * PROTECTED ROUTE: Requires authentication
 * - Unauthenticated users are redirected to /auth/signin
 * - Session is checked on every page load
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/config';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Check authentication
  const session = await getServerSession(authOptions);

  // Redirect to sign in if not authenticated
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
