/**
 * Admin System Monitoring Page
 *
 * Comprehensive system health and performance monitoring
 *
 * @route /admin/system
 */

import { requireAdmin } from '@/lib/auth/server-auth';
import { getSystemMetrics } from '@/lib/actions/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ActivityIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ServerIcon,
  DatabaseIcon,
  PackageIcon,
  UsersIcon,
  FolderIcon,
  FlaskConicalIcon,
  ClockIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const metadata = {
  title: 'System Monitoring | Admin | Pressograph',
  description: 'Monitor system health, performance, and metrics',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export default async function AdminSystemPage() {
  await requireAdmin();

  const metrics = await getSystemMetrics();
  const hasError = 'error' in metrics;

  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary text-primary-foreground p-3 rounded-lg">
          <ActivityIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive system health and performance metrics
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {hasError && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircleIcon className="h-5 w-5" />
              System Error
            </CardTitle>
            <CardDescription>
              {metrics.error || 'Failed to fetch system metrics'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {metrics.database.healthy ? (
                <>
                  <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                  <span className="text-xl font-bold text-green-600">Healthy</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                  <span className="text-xl font-bold text-red-600">Error</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              PostgreSQL {metrics.database.version}
            </p>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.metrics.users}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.metrics.activeSessions} active in last 24h
            </p>
          </CardContent>
        </Card>

        {/* Total Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.metrics.projects}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        {/* Total Tests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FlaskConicalIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.metrics.tests}</div>
            <p className="text-xs text-muted-foreground">
              Pressure tests created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            <CardTitle>Database Information</CardTitle>
          </div>
          <CardDescription>
            PostgreSQL database metrics and schema information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Version</span>
                <Badge variant="outline">{metrics.database.version}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Schema Version</span>
                <Badge variant="secondary">{metrics.database.schemaVersion}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Database Size</span>
                <span className="font-mono font-medium">
                  {formatBytes(metrics.database.sizeBytes)}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Tables Size</span>
                <span className="font-mono font-medium">
                  {formatBytes(metrics.database.tablesSize)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Indexes Size</span>
                <span className="font-mono font-medium">
                  {formatBytes(metrics.database.indexesSize)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Status</span>
                {metrics.database.healthy ? (
                  <Badge variant="default" className="bg-green-600">
                    Operational
                  </Badge>
                ) : (
                  <Badge variant="destructive">Error</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Versions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            <CardTitle>Component Versions</CardTitle>
          </div>
          <CardDescription>
            Runtime environment and framework versions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1 border rounded-lg p-4">
              <span className="text-sm text-muted-foreground">Node.js</span>
              <span className="text-xl font-bold font-mono">{metrics.components.node}</span>
            </div>
            <div className="flex flex-col space-y-1 border rounded-lg p-4">
              <span className="text-sm text-muted-foreground">Next.js</span>
              <span className="text-xl font-bold font-mono">{metrics.components.nextjs}</span>
            </div>
            <div className="flex flex-col space-y-1 border rounded-lg p-4">
              <span className="text-sm text-muted-foreground">React</span>
              <span className="text-xl font-bold font-mono">{metrics.components.react}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5" />
            <CardTitle>System Information</CardTitle>
          </div>
          <CardDescription>
            Last checked: {formatDistanceToNow(metrics.timestamp, { addSuffix: true })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Platform</span>
                <Badge variant="outline">{metrics.system.platform}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Architecture</span>
                <Badge variant="outline">{metrics.system.architecture}</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Environment</span>
                <Badge variant={metrics.system.environment === 'production' ? 'default' : 'secondary'}>
                  {metrics.system.environment}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  Uptime
                </span>
                <span className="font-mono font-medium">
                  {formatUptime(metrics.system.uptimeSeconds)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
