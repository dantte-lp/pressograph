/**
 * Admin Dashboard Page
 *
 * Provides system-wide administration:
 * - System statistics and health
 * - User management overview
 * - Organization overview
 * - Recent activity
 * - Quick access to admin functions
 *
 * Access: Admin users only
 *
 * @route /admin
 */

import { requireAdmin } from '@/lib/auth/server-auth';
import { getAdminStats, getRecentAdminActivity, getOrganizations } from '@/lib/actions/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UsersIcon,
  Building2Icon,
  FolderIcon,
  FlaskConicalIcon,
  ActivityIcon,
  HardDriveIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export const metadata = {
  title: 'Admin Dashboard | Pressograph',
  description: 'System administration and management',
};

export default async function AdminPage() {
  // Ensure user is admin
  await requireAdmin();

  // Fetch admin data
  const [stats, activity, organizations] = await Promise.all([
    getAdminStats(),
    getRecentAdminActivity(10),
    getOrganizations(),
  ]);

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary text-primary-foreground p-3 rounded-lg">
          <ShieldCheckIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            System administration and management overview
          </p>
        </div>
      </div>

      {/* System Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">System Statistics</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeUsers} active (7 days)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Building2Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
              <p className="text-xs text-muted-foreground mt-1">Active organizations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <FolderIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">Total projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests</CardTitle>
              <FlaskConicalIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalTestRuns} test runs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
              <HardDriveIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.storageUsed)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalFileUploads} files
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Users</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Organizations Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>Manage organizations and their settings</CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/organizations">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No organizations yet
            </div>
          ) : (
            <div className="space-y-3">
              {organizations.slice(0, 5).map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {org._count.users} users · {org._count.projects} projects
                    </div>
                  </div>
                  <Badge variant="outline">{org.slug}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent users
              </div>
            ) : (
              <div className="space-y-3">
                {activity.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between border-b pb-3 last:border-b-0"
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                        {user.role}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Latest project creations</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent projects
              </div>
            ) : (
              <div className="space-y-3">
                {activity.projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start justify-between border-b pb-3 last:border-b-0"
                  >
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-muted-foreground">
                        by {project.owner.name} · {project.organization.name}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(project.createdAt, { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/users">
                <UsersIcon className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/organizations">
                <Building2Icon className="mr-2 h-4 w-4" />
                Manage Organizations
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/system">
                <ActivityIcon className="mr-2 h-4 w-4" />
                System Health
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
