import { getTests } from '@/lib/actions/tests';
import type { TestFilters, PaginationParams } from '@/lib/actions/tests';
import { TestsTableClient } from './tests-table-client';

interface TestsTableProps {
  page: number;
  pageSize: number;
  search?: string;
  projectId?: string;
  status?: string[];
  sortBy?: 'newest' | 'oldest' | 'testNumber' | 'name';
}

/**
 * Server Component wrapper for tests table
 * Fetches data and passes to client component
 */
export async function TestsTable({
  page,
  pageSize,
  search,
  projectId,
  status,
  sortBy,
}: TestsTableProps) {
  // Build filters
  const filters: TestFilters = {
    search,
    projectId,
    status: status as any,
    sortBy,
  };

  // Build pagination
  const pagination: PaginationParams = {
    page,
    pageSize,
  };

  // Fetch tests
  const data = await getTests(filters, pagination);

  return <TestsTableClient data={data} filters={filters} pagination={pagination} />;
}
