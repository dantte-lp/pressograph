import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderIcon, FlaskConicalIcon, BarChart3Icon, ActivityIcon, HardDriveIcon, Archive } from 'lucide-react';
import { getDashboardStats, getRecentActivity } from '@/lib/actions/dashboard';
import { formatBytes } from '@/lib/utils/format';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

/**
 * Dashboard Home Page
 *
 * Overview page with:
 * - Quick stats
 * - Recent activity
 * - Quick actions
 */

export default async function DashboardPage() {
  // Fetch dashboard data
  const stats = await getDashboardStats();
  const activities = await getRecentActivity();

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of your pressure testing projects.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FolderIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-muted-foreground text-xs">
              {stats.totalProjects === 0 ? 'No projects yet' : 'Active projects'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Tests
            </CardTitle>
            <FlaskConicalIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTests}</div>
            <p className="text-muted-foreground text-xs">
              {stats.activeTests === 0 ? 'No active tests' : 'Running or ready'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Runs
            </CardTitle>
            <ActivityIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentTestRuns}</div>
            <p className="text-muted-foreground text-xs">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Storage Used
            </CardTitle>
            <HardDriveIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.storageUsed)}</div>
            <p className="text-muted-foreground text-xs">
              Total file storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation - Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Projects</CardTitle>
          </div>
          <CardDescription>
            Manage your pressure test projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/projects">
                <FolderIcon className="mr-2 h-4 w-4" />
                List Projects
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/projects?archived=true">
                <Archive className="mr-2 h-4 w-4" />
                Archived Projects
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation - Tests */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConicalIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Tests</CardTitle>
          </div>
          <CardDescription>
            View and create pressure tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/tests">
                <FlaskConicalIcon className="mr-2 h-4 w-4" />
                List Tests
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tests?status=active">
                <ActivityIcon className="mr-2 h-4 w-4" />
                Active Tests
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest actions across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
              No activity yet. Create a project or test to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  href={activity.link as any}
                  className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-1">
                    {activity.type === 'project_created' && (
                      <FolderIcon className="text-muted-foreground h-5 w-5" />
                    )}
                    {activity.type === 'test_created' && (
                      <FlaskConicalIcon className="text-muted-foreground h-5 w-5" />
                    )}
                    {activity.type === 'test_run' && (
                      <BarChart3Icon className="text-muted-foreground h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-muted-foreground text-xs">{activity.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
