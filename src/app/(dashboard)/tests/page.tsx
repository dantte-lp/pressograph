import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { TestsTable } from '@/components/tests/tests-table';
import { TestsTableSkeleton } from '@/components/tests/tests-table-skeleton';
import { TestsFilterBar } from '@/components/tests/tests-filter-bar';
import { getProjects } from '@/lib/actions/projects';

/**
 * Tests Page
 *
 * Global view of all pressure tests across all projects.
 * Replaces the old /history route from v1.0.
 *
 * Features:
 * - Advanced search with debounce
 * - Multi-filter (status, project, date range)
 * - Column sorting
 * - Pagination
 * - Batch operations
 * - Per-test actions (view, download, share, delete)
 * - Status indicators
 * - Empty states
 * - Full i18n support
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
  // Get translations
  const t = await getTranslations('tests');

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

  // Fetch projects for filter dropdown
  const projectsResult = await getProjects({ page: 1, pageSize: 100 });
  const projects = projectsResult.projects.map(p => ({ id: p.id, name: p.name }));

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('allTests')}
          </p>
        </div>
        <Button asChild>
          <Link href={"/tests/new" as any}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {t('createTest')}
          </Link>
        </Button>
      </div>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('allTests')}</CardTitle>
          <CardDescription>
            {t('allTests')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filter Bar */}
          <TestsFilterBar projects={projects} />

          {/* Table */}
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
