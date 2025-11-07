import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlaskConicalIcon, PlusIcon } from 'lucide-react';
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
  searchParams: {
    page?: string;
    pageSize?: string;
    search?: string;
    project?: string;
    status?: string;
    sortBy?: string;
  };
}

export default function TestsPage({ searchParams }: TestsPageProps) {
  // Parse search params
  const page = parseInt(searchParams.page ?? '1', 10);
  const pageSize = parseInt(searchParams.pageSize ?? '20', 10);
  const search = searchParams.search;
  const projectId = searchParams.project;
  const status = searchParams.status?.split(',').filter(Boolean);
  const sortBy = searchParams.sortBy as 'newest' | 'oldest' | 'testNumber' | 'name' | undefined;

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
          <Link href="/tests/new">
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
