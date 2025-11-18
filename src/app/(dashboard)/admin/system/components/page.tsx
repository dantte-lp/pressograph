/**
 * Admin System Components Page
 *
 * Display all Node.js system components with version checking
 *
 * @route /admin/system/components
 */

import { requireAdmin } from '@/lib/auth/server-auth';
import { getPackageVersionsFromDB } from '@/lib/actions/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PackageIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ArrowLeftIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  DatabaseIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { PackageSyncButton } from '@/components/admin/package-sync-button';

export const metadata = {
  title: 'System Components | Admin | Pressograph',
  description: 'View and manage system package versions',
};

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
}

function getVersionBadge(isUpToDate: boolean) {
  if (isUpToDate) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        <CheckCircle2Icon className="h-3 w-3 mr-1" />
        Up to date
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <AlertCircleIcon className="h-3 w-3 mr-1" />
      Update available
    </Badge>
  );
}

export default async function AdminSystemComponentsPage() {
  await requireAdmin();

  let packageData;
  let error = null;
  let needsInitialSync = false;

  try {
    packageData = await getPackageVersionsFromDB();

    // If no data in database, needs initial sync
    if (!packageData) {
      needsInitialSync = true;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load package versions from database';
    packageData = null;
  }

  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-3 rounded-lg">
            <PackageIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Components</h1>
            <p className="text-muted-foreground mt-1">
              Node.js package versions and update status
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/system">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to System
            </Link>
          </Button>
          <PackageSyncButton />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircleIcon className="h-5 w-5" />
              Error Loading Packages
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Initial Sync Notice */}
      {needsInitialSync && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              Initial Sync Required
            </CardTitle>
            <CardDescription className="text-blue-600 dark:text-blue-300">
              No package data found in database. Click the "Sync Now" button above to fetch package information from npm registry.
              This will take 30-60 seconds to complete.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Summary Cards */}
      {packageData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packageData.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Dependencies and devDependencies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Up to Date</CardTitle>
              <CheckCircle2Icon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{packageData.upToDate}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((packageData.upToDate / packageData.total) * 100).toFixed(1)}% current
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outdated</CardTitle>
              <AlertCircleIcon className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{packageData.outdated}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Updates available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Checked</CardTitle>
              <RefreshCwIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {formatDistanceToNow(packageData.lastChecked, { addSuffix: true })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(packageData.lastChecked).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Packages Table */}
      {packageData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Package Versions</CardTitle>
                <CardDescription>
                  All installed packages from package.json with version comparison
                </CardDescription>
              </div>
              {packageData.outdated > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {packageData.outdated} update{packageData.outdated !== 1 ? 's' : ''} available
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Package Name</TableHead>
                    <TableHead className="w-[70px]">Type</TableHead>
                    <TableHead className="w-[100px]">Current Version</TableHead>
                    <TableHead className="w-[120px]">Current Released</TableHead>
                    <TableHead className="w-[100px]">Latest Version</TableHead>
                    <TableHead className="w-[120px]">Latest Released</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packageData.packages.map((pkg) => (
                    <TableRow key={pkg.name} className={pkg.isUpToDate ? '' : 'bg-amber-50/50 dark:bg-amber-950/20'}>
                      <TableCell className="font-mono text-sm max-w-[250px]">
                        <div className="flex flex-col">
                          <span className="font-semibold truncate">{pkg.name}</span>
                          {pkg.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {pkg.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[70px]">
                        <Badge variant={pkg.type === 'dependency' ? 'default' : 'secondary'} className="text-xs">
                          {pkg.type === 'dependency' ? 'prod' : 'dev'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium max-w-[100px] truncate">
                        {pkg.currentVersion}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                        {formatDate(pkg.currentReleaseDate)}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium max-w-[100px] truncate">
                        {pkg.latestVersion}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                        {formatDate(pkg.latestReleaseDate)}
                      </TableCell>
                      <TableCell>
                        {getVersionBadge(pkg.isUpToDate)}
                      </TableCell>
                      <TableCell>
                        {pkg.homepage && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={pkg.homepage} target="_blank" rel="noopener noreferrer">
                              <ExternalLinkIcon className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Table Footer */}
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <div>
                Showing {packageData.packages.length} package{packageData.packages.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                  <span>Up to date</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <span>Update available</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Package Updates</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            This page displays version information for all Node.js packages installed in your Pressograph application.
            The data is stored in the database and loaded instantly without querying npm.
          </p>
          <p className="font-medium mt-3 flex items-center gap-2">
            <DatabaseIcon className="h-4 w-4" />
            Database-Backed Caching
          </p>
          <p>
            Package data is cached in the database to prevent timeouts. Click "Sync Now" to fetch the latest
            information from npm registry (takes 30-60 seconds). The last sync timestamp is shown above.
          </p>
          <p>
            Package versions are compared against the latest stable releases on npm. Note that not all updates are
            necessarily safe or recommended - always review release notes and test updates in a development environment
            before applying them to production.
          </p>
          <p className="font-medium mt-3">
            To update packages, use the following command in your development environment:
          </p>
          <pre className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto mt-2">
            pnpm update [package-name]
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
