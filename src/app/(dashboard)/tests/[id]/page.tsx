import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditIcon, Share2Icon, CopyIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getTestById } from '@/lib/actions/tests';
import { TestStatusBadge } from '@/components/tests/test-status-badge';
import { TestConfigDisplay } from '@/components/tests/test-config-display';
import { TestActionsDropdown } from '@/components/tests/test-actions-dropdown';
import { PressureTestPreview } from '@/components/tests/pressure-test-preview';
import { EmulationExportDialog } from '@/components/tests/emulation-export-dialog';
import { EChartsExportDialog } from '@/components/tests/echarts-export-dialog';
import { ExportConfigButton } from '@/components/tests/export-config-button';
import { formatDate, formatDateTime } from '@/lib/utils/format';

/**
 * Test Detail Page
 *
 * Shows comprehensive information about a single pressure test including:
 * - Test configuration and parameters
 * - Generated graphs
 * - Sharing settings
 * - Actions (edit, delete, share, download)
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
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/tests">Tests</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{test.testNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{test.name}</h1>
            <TestStatusBadge status={test.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground" role="contentinfo" aria-label="Test metadata">
            <span aria-label="Test number">Test #{test.testNumber}</span>
            <span aria-hidden="true">•</span>
            <Link
              href={`/projects/${test.projectId}`}
              className="hover:text-foreground transition-colors"
              aria-label={`Go to project ${test.projectName}`}
            >
              {test.projectName}
            </Link>
            <span aria-hidden="true">•</span>
            <time dateTime={test.createdAt.toString()} aria-label="Creation date">
              Created {formatDate(test.createdAt)}
            </time>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Test actions">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tests/${test.id}/edit` as any} aria-label="Edit test configuration">
              <EditIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          </Button>
          <TestActionsDropdown test={test} />
        </div>
      </header>

      {/* Tags */}
      {test.tags && test.tags.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Test tags">
          {test.tags.map((tag) => (
            <Badge key={tag} variant="secondary" role="note">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <Separator className="my-6" />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4" aria-label="Test information sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="graph">Graph Preview</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6" role="tabpanel" aria-label="Overview information">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Configuration Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Status</dt>
                    <dd>
                      <Badge variant={test.status === 'ready' ? 'default' : 'secondary'}>
                        {test.status === 'ready' ? 'Finalized' : 'Draft'}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Template</dt>
                    <dd>
                      <Badge variant="outline">
                        {test.templateType || 'Custom'}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Last Updated</dt>
                    <dd>
                      <time dateTime={test.updatedAt.toString()} className="text-sm">
                        {formatDate(test.updatedAt)}
                      </time>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Test Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Test Number</dt>
                    <dd className="text-sm font-medium">{test.testNumber}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Created By</dt>
                    <dd className="text-sm">{test.createdByName}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">Created</dt>
                    <dd>
                      <time dateTime={test.createdAt.toString()} className="text-sm">
                        {formatDate(test.createdAt)}
                      </time>
                    </dd>
                  </div>
                  {test.config.startDateTime && (
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-muted-foreground">Scheduled</dt>
                      <dd>
                        <time dateTime={test.config.startDateTime} className="text-sm">
                          {formatDateTime(test.config.startDateTime)}
                        </time>
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <nav aria-label="Quick actions menu">
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
                  <Button variant="outline" size="sm" className="w-full justify-start" disabled aria-disabled="true">
                    <Share2Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    Create Share Link
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <Link href={`/tests/new?duplicate=${test.id}` as any} aria-label="Duplicate this test">
                      <CopyIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                      Duplicate Test
                    </Link>
                  </Button>
                </nav>
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
              <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground mb-1">Working Pressure</dt>
                  <dd className="font-medium">
                    {test.config.workingPressure} {test.config.pressureUnit || 'MPa'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Max Pressure</dt>
                  <dd className="font-medium">
                    {test.config.maxPressure} {test.config.pressureUnit || 'MPa'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Test Duration</dt>
                  <dd className="font-medium">{test.config.testDuration} hours</dd>
                </div>
                {test.config.temperature && (
                  <div>
                    <dt className="text-muted-foreground mb-1">Temperature</dt>
                    <dd className="font-medium">
                      {test.config.temperature}°{test.config.temperatureUnit || 'C'}
                    </dd>
                  </div>
                )}
                {test.config.allowablePressureDrop && (
                  <div>
                    <dt className="text-muted-foreground mb-1">Allowable Pressure Drop</dt>
                    <dd className="font-medium">
                      {test.config.allowablePressureDrop} {test.config.pressureUnit || 'MPa'}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground mb-1">Intermediate Stages</dt>
                  <dd className="font-medium">
                    {test.config.intermediateStages?.length || 0}
                  </dd>
                </div>
                {test.config.equipmentId && (
                  <div>
                    <dt className="text-muted-foreground mb-1">Equipment ID</dt>
                    <dd className="font-medium">{test.config.equipmentId}</dd>
                  </div>
                )}
                {test.config.operatorName && (
                  <div>
                    <dt className="text-muted-foreground mb-1">Operator</dt>
                    <dd className="font-medium">{test.config.operatorName}</dd>
                  </div>
                )}
                {test.config.startDateTime && (
                  <div>
                    <dt className="text-muted-foreground mb-1">Start Date/Time</dt>
                    <dd className="font-medium">
                      <time dateTime={test.config.startDateTime}>
                        {formatDateTime(test.config.startDateTime)}
                      </time>
                    </dd>
                  </div>
                )}
                {test.config.endDateTime && (
                  <div>
                    <dt className="text-muted-foreground mb-1">End Date/Time</dt>
                    <dd className="font-medium">
                      <time dateTime={test.config.endDateTime}>
                        {formatDateTime(test.config.endDateTime)}
                      </time>
                    </dd>
                  </div>
                )}
              </dl>
              {test.config.notes && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-muted-foreground text-xs mb-2">Notes</h3>
                  <p className="text-sm whitespace-pre-wrap">{test.config.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" role="tabpanel" aria-label="Configuration details">
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
        <TabsContent value="graph" role="tabpanel" aria-label="Graph preview">
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
              <div role="img" aria-label="Pressure test graph visualization">
                <PressureTestPreview
                  workingPressure={test.config.workingPressure}
                  maxPressure={test.config.maxPressure}
                  testDuration={test.config.testDuration}
                  intermediateStages={test.config.intermediateStages || []}
                  pressureUnit={test.config.pressureUnit || 'MPa'}
                  startDateTime={test.config.startDateTime || undefined}
                  endDateTime={test.config.endDateTime || undefined}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sharing Tab */}
        <TabsContent value="sharing" role="tabpanel" aria-label="Sharing settings">
          <Card>
            <CardHeader>
              <CardTitle>Share Settings</CardTitle>
              <CardDescription>
                Configure public access to test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between" role="group" aria-label="Public access status">
                  <div className="space-y-0.5">
                    <h3 className="font-medium">Public Access</h3>
                    <p className="text-sm text-muted-foreground">
                      {test.isPublic
                        ? 'This test is publicly accessible'
                        : 'This test is private'}
                    </p>
                  </div>
                  <Badge variant={test.isPublic ? 'default' : 'secondary'} role="status">
                    {test.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>

                {test.isPublic && test.shareToken && (
                  <>
                    <Separator />
                    <div className="rounded-lg border p-4 space-y-2">
                      <h3 className="text-sm font-medium">Share URL</h3>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-muted px-2 py-1 text-sm" aria-label="Share link URL">
                          {`${process.env.NEXT_PUBLIC_APP_URL}/share/${test.shareToken}`}
                        </code>
                        <Button size="sm" variant="outline" aria-label="Copy share link to clipboard">
                          <CopyIcon className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Copy</span>
                        </Button>
                      </div>
                    </div>

                    {test.shareExpiresAt && (
                      <p className="text-sm text-muted-foreground" role="note">
                        Expires: <time dateTime={test.shareExpiresAt.toString()}>{formatDateTime(test.shareExpiresAt)}</time>
                      </p>
                    )}
                  </>
                )}

                <Separator />

                <Button disabled aria-disabled="true">
                  <Share2Icon className="mr-2 h-4 w-4" aria-hidden="true" />
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
