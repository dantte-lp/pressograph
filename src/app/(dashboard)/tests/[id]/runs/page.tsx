import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PlayIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getTestById } from '@/lib/actions/tests';
import { TestRunsTable } from '@/components/tests/test-runs-table';

/**
 * Test Runs Page
 *
 * Shows execution history for a specific pressure test including:
 * - All test runs with dates and results
 * - Pass/fail status
 * - Execution duration
 * - Operator information
 * - Link to detailed run view
 */

interface TestRunsPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
  }>;
}

export default async function TestRunsPage({ params, searchParams }: TestRunsPageProps) {
  const { id } = await params;
  const searchParam = await searchParams;

  const page = parseInt(searchParam.page ?? '1', 10);
  const pageSize = parseInt(searchParam.pageSize ?? '20', 10);

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
        <Link href={`/tests/${test.id}`} className="hover:text-foreground transition-colors">
          {test.testNumber}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Runs</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Test Runs</h1>
          <p className="text-muted-foreground">
            Execution history for <strong>{test.name}</strong>
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/tests/${test.id}`}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Test
            </Link>
          </Button>
          {test.status === 'ready' && (
            <Button asChild>
              <Link href={`/tests/${test.id}/run` as any}>
                <PlayIcon className="mr-2 h-4 w-4" />
                Run Test
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Test Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>
            {test.runCount} run{test.runCount !== 1 ? 's' : ''} executed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {test.runCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PlayIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No test runs yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                This test has not been executed yet
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
            <Suspense fallback={<TestRunsTableSkeleton />}>
              <TestRunsTable testId={test.id} page={page} pageSize={pageSize} />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TestRunsTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
