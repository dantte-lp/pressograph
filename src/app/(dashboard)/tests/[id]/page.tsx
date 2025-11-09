import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditIcon, Share2Icon, CopyIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTestById } from '@/lib/actions/tests';
import { getTestRuns, getTestRunStatistics } from '@/lib/actions/test-runs';
import { TestStatusBadge } from '@/components/tests/test-status-badge';
import { TestConfigDisplay } from '@/components/tests/test-config-display';
import { TestActionsDropdown } from '@/components/tests/test-actions-dropdown';
import { PressureTestPreview } from '@/components/tests/pressure-test-preview';
import { EmulationExportDialog } from '@/components/tests/emulation-export-dialog';
import { EChartsExportDialog } from '@/components/tests/echarts-export-dialog';
import { ExportConfigButton } from '@/components/tests/export-config-button';
import { TestRunsList } from '@/components/test-runs/test-runs-list';
import { StartTestRunButton } from '@/components/test-runs/start-test-run-button';
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

  // Fetch test details and runs
  const test = await getTestById(id);

  if (!test) {
    notFound();
  }

  // Fetch test runs and statistics
  const [runs, stats] = await Promise.all([
    getTestRuns(id),
    getTestRunStatistics(id),
  ]);

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
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="runs">
            Test Runs
            {stats.totalRuns > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.totalRuns}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="graph">Graph Preview</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Configuration Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={test.status === 'ready' ? 'default' : 'secondary'}>
                      {test.status === 'ready' ? 'Finalized' : 'Draft'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Template</span>
                    <Badge variant="outline">
                      {test.templateType || 'Custom'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm">{formatDate(test.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Test Number</span>
                    <span className="text-sm font-medium">{test.testNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created By</span>
                    <span className="text-sm">{test.createdByName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm">{formatDate(test.createdAt)}</span>
                  </div>
                  {test.config.startDateTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Scheduled</span>
                      <span className="text-sm">{formatDateTime(test.config.startDateTime)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <EmulationExportDialog
                  testNumber={test.testNumber}
                  testName={test.name}
                  config={test.config}
                />
                <EChartsExportDialog
                  testNumber={test.testNumber}
                  testName={test.name}
                  config={test.config}
                />
                <ExportConfigButton
                  config={test.config}
                  testNumber={test.testNumber}
                  testName={test.name}
                  description={test.description || undefined}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                />
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

          {/* Comprehensive Test Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Parameters</CardTitle>
              <CardDescription>
                Complete pressure test configuration and metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Working Pressure</div>
                  <div className="font-medium">
                    {test.config.workingPressure} {test.config.pressureUnit || 'MPa'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Max Pressure</div>
                  <div className="font-medium">
                    {test.config.maxPressure} {test.config.pressureUnit || 'MPa'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Test Duration</div>
                  <div className="font-medium">{test.config.testDuration} hours</div>
                </div>
                {test.config.temperature && (
                  <div>
                    <div className="text-muted-foreground mb-1">Temperature</div>
                    <div className="font-medium">
                      {test.config.temperature}°{test.config.temperatureUnit || 'C'}
                    </div>
                  </div>
                )}
                {test.config.allowablePressureDrop && (
                  <div>
                    <div className="text-muted-foreground mb-1">Allowable Pressure Drop</div>
                    <div className="font-medium">
                      {test.config.allowablePressureDrop} {test.config.pressureUnit || 'MPa'}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground mb-1">Intermediate Stages</div>
                  <div className="font-medium">
                    {test.config.intermediateStages?.length || 0}
                  </div>
                </div>
                {test.config.equipmentId && (
                  <div>
                    <div className="text-muted-foreground mb-1">Equipment ID</div>
                    <div className="font-medium">{test.config.equipmentId}</div>
                  </div>
                )}
                {test.config.operatorName && (
                  <div>
                    <div className="text-muted-foreground mb-1">Operator</div>
                    <div className="font-medium">{test.config.operatorName}</div>
                  </div>
                )}
                {test.config.startDateTime && (
                  <div>
                    <div className="text-muted-foreground mb-1">Start Date/Time</div>
                    <div className="font-medium">
                      {formatDateTime(test.config.startDateTime)}
                    </div>
                  </div>
                )}
                {test.config.endDateTime && (
                  <div>
                    <div className="text-muted-foreground mb-1">End Date/Time</div>
                    <div className="font-medium">
                      {formatDateTime(test.config.endDateTime)}
                    </div>
                  </div>
                )}
              </div>
              {test.config.notes && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-muted-foreground text-xs mb-2">Notes</div>
                  <p className="text-sm whitespace-pre-wrap">{test.config.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Runs Tab */}
        <TabsContent value="runs" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRuns}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completedRuns}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.averageDuration
                    ? `${Math.round(stats.averageDuration / 60)}m`
                    : '—'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Runs List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle>Test Execution History</CardTitle>
                <CardDescription>
                  All test runs with measurements, results, and operator notes
                </CardDescription>
              </div>
              <StartTestRunButton
                testId={test.id}
                testNumber={test.testNumber}
                testName={test.name}
              />
            </CardHeader>
            <CardContent>
              <TestRunsList runs={runs} testId={test.id} />
            </CardContent>
          </Card>
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle>Pressure Test Graph Preview</CardTitle>
                <CardDescription>
                  Visual representation of the configured test profile
                </CardDescription>
              </div>
              <EmulationExportDialog
                testNumber={test.testNumber}
                testName={test.name}
                config={test.config}
              />
            </CardHeader>
            <CardContent>
              <PressureTestPreview
                workingPressure={test.config.workingPressure}
                maxPressure={test.config.maxPressure}
                testDuration={test.config.testDuration}
                intermediateStages={test.config.intermediateStages || []}
                pressureUnit={test.config.pressureUnit || 'MPa'}
                startDateTime={test.config.startDateTime || undefined}
                endDateTime={test.config.endDateTime || undefined}
              />
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
