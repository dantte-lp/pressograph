'use client';

/**
 * Tests Page Client Component
 *
 * Client-side wrapper for the tests page with i18n support
 *
 * Features:
 * - i18n support using useTranslation hook
 * - Advanced search with debounce
 * - Multi-filter (status, project, date range)
 * - Column sorting
 * - Pagination
 * - Full i18n support
 */

import { Suspense } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { TestsTable } from '@/components/tests/tests-table';
import { TestsTableSkeleton } from '@/components/tests/tests-table-skeleton';
import { TestsFilterBar } from '@/components/tests/tests-filter-bar';

interface TestsPageClientProps {
  page: number;
  pageSize: number;
  search?: string;
  projectId?: string;
  status?: string[];
  sortBy?: 'newest' | 'oldest' | 'testNumber' | 'name';
  projects: Array<{ id: string; name: string }>;
}

export function TestsPageClient({
  page,
  pageSize,
  search,
  projectId,
  status,
  sortBy,
  projects,
}: TestsPageClientProps) {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('tests.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('tests.allTests')}
          </p>
        </div>
        <Button asChild>
          <Link href={"/tests/new" as any}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {t('tests.createTest')}
          </Link>
        </Button>
      </div>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tests.allTests')}</CardTitle>
          <CardDescription>
            {t('tests.allTests')}
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
