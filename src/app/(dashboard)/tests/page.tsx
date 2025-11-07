import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { TestsTable } from '@/components/tests/tests-table';
import { TestsTableSkeleton } from '@/components/tests/tests-table-skeleton';

/**
 * Tests Page
 *
 * Global view of all pressure tests across all projects.
 * Replaces the old /history route from v1.0.
 *
 * Features:
 * - Searchable and filterable table
 * - Pagination
 * - Per-test actions (view, download, share, delete)
 * - Status indicators
 * - Empty states
 */

interface TestsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    project?: string;
    status?: string;
    sortBy?: string;
  }>;
}

export default async function TestsPage({ searchParams }: TestsPageProps) {
  // Parse search params (await Promise in Next.js 16+)
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const pageSize = parseInt(params.pageSize ?? '20', 10);
  const search = params.search;
  const projectId = params.project;

  // Map 'active' filter to actual database statuses ('running' and 'ready')
  let status = params.status?.split(',').filter(Boolean);
  if (status?.includes('active')) {
    // Replace 'active' with the actual database statuses
    status = status.filter(s => s !== 'active').concat(['running', 'ready']);
  }

  const sortBy = params.sortBy as 'newest' | 'oldest' | 'testNumber' | 'name' | undefined;

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tests</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all your pressure tests
          </p>
        </div>
        <Button asChild>
          <Link href={"/tests/new" as any}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Test
          </Link>
        </Button>
      </div>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tests</CardTitle>
          <CardDescription>
            Complete list of pressure tests across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TestsTableSkeleton />}>
            <TestsTable
              page={page}
              pageSize={pageSize}
              search={search}
              projectId={projectId}
              status={status}
              sortBy={sortBy}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
