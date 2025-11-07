import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CheckCircle2Icon, XCircleIcon, ClockIcon, DownloadIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getTestRunById } from '@/lib/actions/tests';
import { formatBytes } from '@/lib/utils/format';
import type { TestRunResults } from '@/lib/db/schema/test-runs';

/**
 * Test Run Detail Page
 *
 * Displays complete information about a specific test run execution:
 * - Pass/fail status
 * - Execution metadata (date, operator, duration)
 * - Pressure vs time graph visualization
 * - Measurement data table
 * - Operator notes
 * - Download links for generated files
 */

interface TestRunDetailPageProps {
  params: Promise<{
    id: string;
    runId: string;
  }>;
}

export default async function TestRunDetailPage({ params }: TestRunDetailPageProps) {
  const { runId } = await params;

  // Fetch test run details
  const testRun = await getTestRunById(runId);

  if (!testRun) {
    notFound();
  }

  const results = testRun.results as TestRunResults;
  const durationMinutes = testRun.duration ? Math.floor(testRun.duration / 60) : null;

  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/tests" className="hover:text-foreground transition-colors">
          Tests
        </Link>
        <span>/</span>
        <Link href={`/tests/${testRun.pressureTestId}`} className="hover:text-foreground transition-colors">
          {testRun.testNumber}
        </Link>
        <span>/</span>
        <Link href={`/tests/${testRun.pressureTestId}/runs`} className="hover:text-foreground transition-colors">
          Runs
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {new Date(testRun.startedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Test Run Results</h1>
            {testRun.passed !== null && (
              <Badge variant={testRun.passed ? 'default' : 'destructive'} className="h-7 px-3">
                {testRun.passed ? (
                  <>
                    <CheckCircle2Icon className="mr-1 h-4 w-4" />
                    Passed
                  </>
                ) : (
                  <>
                    <XCircleIcon className="mr-1 h-4 w-4" />
                    Failed
                  </>
                )}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {testRun.testName} ({testRun.testNumber})
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href={`/tests/${testRun.pressureTestId}/runs`}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Runs
          </Link>
        </Button>
      </div>

      {/* Execution Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Details</CardTitle>
          <CardDescription>Test run metadata and timing</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Executed By</dt>
              <dd className="text-sm font-semibold">{testRun.executedByName}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Started At</dt>
              <dd className="text-sm font-semibold">
                {new Date(testRun.startedAt).toLocaleString()}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Completed At</dt>
              <dd className="text-sm font-semibold">
                {testRun.completedAt
                  ? new Date(testRun.completedAt).toLocaleString()
                  : 'In Progress'}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Duration</dt>
              <dd className="flex items-center gap-1 text-sm font-semibold">
                <ClockIcon className="h-4 w-4" />
                {durationMinutes !== null ? `${durationMinutes} minutes` : 'N/A'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Test Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Results Summary</CardTitle>
          <CardDescription>Test outcome and key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Final Pressure</dt>
              <dd className="text-lg font-bold">{results.finalPressure} MPa</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Pressure Drop</dt>
              <dd className="text-lg font-bold">{results.pressureDrop} MPa</dd>
            </div>
            {results.averagePressure && (
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Average Pressure</dt>
                <dd className="text-lg font-bold">{results.averagePressure.toFixed(2)} MPa</dd>
              </div>
            )}
            {results.stabilizationTime && (
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Stabilization Time</dt>
                <dd className="text-lg font-bold">{results.stabilizationTime} minutes</dd>
              </div>
            )}
          </dl>

          {testRun.failureReason && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-sm font-medium text-destructive">Failure Reason:</p>
              <p className="text-sm mt-1">{testRun.failureReason}</p>
            </div>
          )}

          {results.notes && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">Operator Notes:</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{results.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pressure Graph - Coming Soon */}
      {results.measurements && results.measurements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pressure vs Time Graph</CardTitle>
            <CardDescription>
              {results.measurements.length} measurement points recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-96 bg-muted rounded-md">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Graph Visualization Coming Soon</p>
                <p className="text-sm text-muted-foreground">
                  Use the measurement data table below to view the recorded values
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Measurement Data Table */}
      {results.measurements && results.measurements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Measurement Data</CardTitle>
            <CardDescription>Raw measurement values</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium">Timestamp</th>
                    <th className="text-left py-2 px-4 font-medium">Pressure (MPa)</th>
                    <th className="text-left py-2 px-4 font-medium">Temperature (°C)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.measurements.slice(0, 100).map((measurement, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4">
                        {new Date(measurement.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-4 font-mono">{measurement.pressure.toFixed(3)}</td>
                      <td className="py-2 px-4 font-mono">{measurement.temperature.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {results.measurements.length > 100 && (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Showing first 100 of {results.measurements.length} measurements
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Files */}
      {testRun.files && testRun.files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Files</CardTitle>
            <CardDescription>
              {testRun.files.length} file{testRun.files.length !== 1 ? 's' : ''} available for download
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testRun.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.fileType} • {formatBytes(file.fileSize)} •{' '}
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/api/files/download/${file.id}`} download={file.fileName}>
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

