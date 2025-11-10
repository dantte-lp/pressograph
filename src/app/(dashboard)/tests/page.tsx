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
 *
 * @route /tests
 */

import { getProjects } from '@/lib/actions/projects';
import { getTests } from '@/lib/actions/tests';
import type { TestFilters, PaginationParams } from '@/lib/actions/tests';
import { TestsPageClient } from '@/components/tests/tests-page-client';

export const metadata = {
  title: 'Tests | Pressograph',
  description: 'Manage all pressure tests across all projects',
};

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

  // Fetch projects for filter dropdown
  const projectsResult = await getProjects({ limit: 100, offset: 0 });
  const projects = projectsResult.projects.map(p => ({ id: p.id, name: p.name }));

  // Build filters for tests query
  const filters: TestFilters = {
    search,
    projectId,
    status: status as any,
    sortBy,
  };

  // Build pagination
  const paginationParams: PaginationParams = {
    page,
    pageSize,
  };

  // Fetch tests data on server
  const testsData = await getTests(filters, paginationParams);

  return (
    <TestsPageClient
      initialData={testsData}
      filters={filters}
      pagination={paginationParams}
      projects={projects}
    />
  );
}
