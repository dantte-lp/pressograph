import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PlayIcon, EditIcon, DownloadIcon, Share2Icon, CopyIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTestById } from '@/lib/actions/tests';
import { TestStatusBadge } from '@/components/tests/test-status-badge';
import { TestConfigDisplay } from '@/components/tests/test-config-display';
import { TestActionsDropdown } from '@/components/tests/test-actions-dropdown';
import { PressureTestPreviewEnhanced } from '@/components/tests/pressure-test-preview-enhanced';
import { formatDate, formatDateTime } from '@/lib/utils/format';

/**
 * Test Detail Page
 *
 * Shows comprehensive information about a single pressure test including:
 * - Test configuration and parameters
 * - Execution history (test runs)
 * - Generated graphs
 * - Sharing settings
 * - Actions (edit, run, delete, share, download)
 */

interface TestDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TestDetailPage({ params }: TestDetailPageProps) {
  const { id } = await params;

  // Fetch test details
  const test = await getTestById(id);

  if (!test) {
    notFound();
  }

  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/tests" className="hover:text-foreground transition-colors">
          Tests
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{test.testNumber}</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{test.name}</h1>
            <TestStatusBadge status={test.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>Test #{test.testNumber}</span>
            <span>•</span>
            <Link
              href={`/projects/${test.projectId}`}
              className="hover:text-foreground transition-colors"
            >
              {test.projectName}
            </Link>
            <span>•</span>
            <span>Created {formatDate(test.createdAt)}</span>
            <span>•</span>
            <span>{test.runCount} run{test.runCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tests/${test.id}/edit` as any}>
              <EditIcon className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {test.status === 'ready' && (
            <Button size="sm" asChild>
              <Link href={`/tests/${test.id}/run` as any}>
                <PlayIcon className="mr-2 h-4 w-4" />
                Run Test
              </Link>
            </Button>
          )}
          <TestActionsDropdown test={test} />
        </div>
      </div>

      {/* Tags */}
      {test.tags && test.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {test.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="graph">Graph Preview</TabsTrigger>
          <TabsTrigger value="runs">
            Test Runs
            {test.runCount > 0 && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {test.runCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Status</span>
                    <TestStatusBadge status={test.status} />
                  </div>
                  {test.startedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Started</span>
                      <span className="text-sm">{formatDateTime(test.startedAt)}</span>
                    </div>
                  )}
                  {test.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <span className="text-sm">{formatDateTime(test.completedAt)}</span>
                    </div>
                  )}
                  {test.lastRunDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Run</span>
                      <span className="text-sm">{formatDateTime(test.lastRunDate)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Template</span>
                    <Badge variant="outline">
                      {test.templateType || 'Custom'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created By</span>
                    <span className="text-sm">{test.createdByName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Runs</span>
                    <span className="text-sm font-medium">{test.runCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm">{formatDate(test.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href={`/tests/${test.id}/runs`}>
                    <PlayIcon className="mr-2 h-4 w-4" />
                    View All Runs
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download Latest Graph
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                  <Share2Icon className="mr-2 h-4 w-4" />
                  Create Share Link
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href={`/tests/new?duplicate=${test.id}` as any}>
                    <CopyIcon className="mr-2 h-4 w-4" />
                    Duplicate Test
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {test.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {test.description}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>
                Complete pressure test parameters and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TestConfigDisplay config={test.config} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graph Preview Tab */}
        <TabsContent value="graph">
          <Card>
            <CardHeader>
              <CardTitle>Pressure Test Graph Preview</CardTitle>
              <CardDescription>
                Visual representation of the configured test profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PressureTestPreviewEnhanced
                workingPressure={test.config.workingPressure}
                maxPressure={test.config.maxPressure}
                testDuration={test.config.testDuration}
                intermediateStages={test.config.intermediateStages || []}
                pressureUnit={test.config.pressureUnit || 'MPa'}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Runs Tab */}
        <TabsContent value="runs">
          <Card>
            <CardHeader>
              <CardTitle>Test Runs</CardTitle>
              <CardDescription>
                Execution history and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {test.runCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PlayIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">No test runs yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Run this test to see execution history
                  </p>
                  {test.status === 'ready' && (
                    <Button className="mt-4" asChild>
                      <Link href={`/tests/${test.id}/run` as any}>
                        <PlayIcon className="mr-2 h-4 w-4" />
                        Run Test Now
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This test has been executed {test.runCount} time{test.runCount !== 1 ? 's' : ''}.
                  </p>
                  <Button asChild>
                    <Link href={`/tests/${test.id}/runs`}>
                      View All Runs
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sharing Tab */}
        <TabsContent value="sharing">
          <Card>
            <CardHeader>
              <CardTitle>Share Settings</CardTitle>
              <CardDescription>
                Configure public access to test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Public Access</div>
                    <div className="text-sm text-muted-foreground">
                      {test.isPublic
                        ? 'This test is publicly accessible'
                        : 'This test is private'}
                    </div>
                  </div>
                  <Badge variant={test.isPublic ? 'default' : 'secondary'}>
                    {test.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>

                {test.isPublic && test.shareToken && (
                  <>
                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="text-sm font-medium">Share URL</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-muted px-2 py-1 text-sm">
                          {`${process.env.NEXT_PUBLIC_APP_URL}/share/${test.shareToken}`}
                        </code>
                        <Button size="sm" variant="outline">
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {test.shareExpiresAt && (
                      <div className="text-sm text-muted-foreground">
                        Expires: {formatDateTime(test.shareExpiresAt)}
                      </div>
                    )}
                  </>
                )}

                <Button disabled>
                  <Share2Icon className="mr-2 h-4 w-4" />
                  {test.isPublic ? 'Update Share Settings' : 'Create Share Link'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
