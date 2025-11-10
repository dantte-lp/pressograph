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
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth/config';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { type Locale } from '@/components/locale-switcher';

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Check authentication
  const session = await getServerSession(authOptions);

  // Redirect to sign in if not authenticated
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  // Get locale from cookie
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value || 'en') as Locale;

  return (
    <DashboardLayout locale={locale} userRole={session.user.role}>
      {children}
    </DashboardLayout>
  );
}
