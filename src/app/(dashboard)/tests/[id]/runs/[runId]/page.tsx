import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon, EditIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTestRunById } from '@/lib/actions/test-runs';
import { TestRunDetail } from '@/components/test-runs/test-run-detail';

/**
 * Test Run Detail Page
 *
 * Shows comprehensive information about a single test run including:
 * - Run metadata (operator, timing, duration)
 * - Measurements data with graph visualization
 * - Results analysis (pass/fail, deviations, statistics)
 * - Operator notes and observations
 */

interface TestRunDetailPageProps {
  params: Promise<{
    id: string;
    runId: string;
  }>;
}

export default async function TestRunDetailPage({ params }: TestRunDetailPageProps) {
  const { id: testId, runId } = await params;

  // Fetch run details
  const run = await getTestRunById(runId);

  if (!run) {
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
        <Link
          href={`/tests/${testId}`}
          className="hover:text-foreground transition-colors"
        >
          {run.testNumber}
        </Link>
        <span>/</span>
        <Link
          href={`/tests/${testId}?tab=runs`}
          className="hover:text-foreground transition-colors"
        >
          Runs
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">#{run.runNumber}</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href={`/tests/${testId}?tab=runs`}>
              <ChevronLeftIcon className="mr-2 h-4 w-4" />
              Back to Test Runs
            </Link>
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {(run.status === 'scheduled' || run.status === 'in_progress') && (
            <Button variant="outline" size="sm" disabled>
              <EditIcon className="mr-2 h-4 w-4" />
              Edit Run
            </Button>
          )}
          {(run.status === 'scheduled' || run.status === 'cancelled') && (
            <Button variant="outline" size="sm" className="text-destructive" disabled>
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete Run
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <TestRunDetail run={run} />
    </div>
  );
}
