/**
 * Dashboard Layout Route
 *
 * This layout wraps all dashboard-related pages (/dashboard, /projects, /tests, etc.)
 * with the sidebar navigation and header.
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
