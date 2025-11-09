/**
 * Admin System Health Page
 *
 * Monitor system health and performance
 *
 * @route /admin/system
 */

import { requireAdmin } from '@/lib/auth/server-auth';
import { getSystemHealth } from '@/lib/actions/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const metadata = {
  title: 'System Health | Admin | Pressograph',
  description: 'Monitor system health and status',
};

export default async function AdminSystemPage() {
  await requireAdmin();

  const health = await getSystemHealth();

  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary text-primary-foreground p-3 rounded-lg">
          <ActivityIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground mt-1">
            Monitor system status and performance
          </p>
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Last checked: {formatDistanceToNow(health.timestamp, { addSuffix: true })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Database Status */}
            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex items-center gap-3">
                {health.database === 'healthy' ? (
                  <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <div className="font-medium">Database</div>
                  <div className="text-sm text-muted-foreground">
                    PostgreSQL connection status
                  </div>
                </div>
              </div>
              <Badge
                variant={health.database === 'healthy' ? 'default' : 'destructive'}
              >
                {health.database}
              </Badge>
            </div>

            {/* Application Status */}
            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Application</div>
                  <div className="text-sm text-muted-foreground">
                    Next.js application status
                  </div>
                </div>
              </div>
              <Badge variant="default">healthy</Badge>
            </div>

            {/* Environment Info */}
            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Environment</div>
                  <div className="text-sm text-muted-foreground">
                    {process.env.NODE_ENV || 'development'}
                  </div>
                </div>
              </div>
              <Badge variant="outline">
                {process.env.NODE_ENV || 'development'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Runtime environment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Node.js Version</span>
              <span className="font-mono">{process.version}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-mono">{process.platform}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Architecture</span>
              <span className="font-mono">{process.arch}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
