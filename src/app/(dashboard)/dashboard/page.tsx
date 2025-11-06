import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderIcon, FlaskConicalIcon, BarChart3Icon } from 'lucide-react';
import { ToastDemo } from '@/components/toast-demo';
import { LoadingDemo } from '@/components/loading-demo';

/**
 * Dashboard Home Page
 *
 * Overview page with:
 * - Quick stats
 * - Recent projects
 * - Recent tests
 * - Quick actions
 * - Toast notifications demo
 * - Loading states demo
 */

export default function DashboardPage() {
  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of your pressure testing projects.
        </p>
      </div>

      {/* Toast Notifications Demo */}
      <ToastDemo />

      {/* Loading States Demo */}
      <LoadingDemo />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FolderIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-muted-foreground text-xs">
              No projects yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tests
            </CardTitle>
            <FlaskConicalIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-muted-foreground text-xs">
              No tests created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Generated Graphs
            </CardTitle>
            <BarChart3Icon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-muted-foreground text-xs">
              Ready to start
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Start creating pressure test graphs
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <a href="/projects">
              <FolderIcon className="mr-2 h-4 w-4" />
              Create Project
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/tests">
              <FlaskConicalIcon className="mr-2 h-4 w-4" />
              Create Test
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/docs">
              View Documentation
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>
              Your latest pressure testing projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
              No projects yet. Create your first project to get started.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tests</CardTitle>
            <CardDescription>
              Your latest pressure tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
              No tests yet. Create your first test to generate graphs.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
