import { getDashboardStats, getRecentActivity } from '@/lib/actions/dashboard';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

/**
 * Dashboard Home Page
 *
 * Overview page with:
 * - Quick stats
 * - Recent activity
 * - Quick actions
 *
 * @route /dashboard
 */

export default async function DashboardPage() {
  // Fetch dashboard data
  const stats = await getDashboardStats();
  const activities = await getRecentActivity();

  return <DashboardContent stats={stats} activities={activities} />;
}
