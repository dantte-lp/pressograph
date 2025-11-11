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

import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { TestsTableClient } from '@/components/tests/tests-table-client';
import { TestsFilterBar } from '@/components/tests/tests-filter-bar';
import type { PaginatedTests, TestFilters, PaginationParams } from '@/lib/actions/tests';

interface TestsPageClientProps {
  initialData: PaginatedTests;
  filters: TestFilters;
  pagination: PaginationParams;
  projects: Array<{ id: string; name: string }>;
  availableTags: string[];
}

export function TestsPageClient({
  initialData,
  filters,
  pagination,
  projects,
  availableTags,
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
          <TestsFilterBar projects={projects} availableTags={availableTags} />

          {/* Table - directly use client component with server-fetched data */}
          <TestsTableClient
            data={initialData}
            filters={filters}
            pagination={pagination}
            availableTags={availableTags}
          />
        </CardContent>
      </Card>
    </div>
  );
}
