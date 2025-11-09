'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontalIcon,
  EyeIcon,
  DownloadIcon,
  Share2Icon,
  CopyIcon,
  PlayIcon,
  Trash2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileDownIcon,
} from 'lucide-react';
import Link from 'next/link';
import { formatBytes } from '@/lib/utils/format';
import type { PaginatedTests, TestFilters, PaginationParams } from '@/lib/actions/tests';
import { DeleteTestDialog } from './delete-test-dialog';
import { BatchDeleteTestsDialog } from './batch-delete-tests-dialog';
import { RelativeTime } from '@/components/ui/relative-time';

interface TestsTableClientProps {
  data: PaginatedTests;
  filters: TestFilters;
  pagination: PaginationParams;
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  ready: 'secondary',
  running: 'default',
  completed: 'default',
  failed: 'destructive',
  cancelled: 'outline',
};

export function TestsTableClient({ data, filters, pagination }: TestsTableClientProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<{ id: string; number: string; name?: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleDeleteClick = (testId: string, testNumber: string, testName?: string) => {
    setTestToDelete({ id: testId, number: testNumber, name: testName });
    setDeleteDialogOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.tests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.tests.map(t => t.id)));
    }
  };

  const toggleSelect = (testId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchDeleteClick = () => {
    setBatchDeleteDialogOpen(true);
  };

  const handleBatchDeleteSuccess = () => {
    setSelectedIds(new Set());
  };

  const handleBatchExportCSV = () => {
    const selectedTests = data.tests.filter(t => selectedIds.has(t.id));
    const csv = [
      ['Test Number', 'Name', 'Project', 'Status', 'Runs', 'Last Run', 'Created'],
      ...selectedTests.map(t => [
        t.testNumber,
        t.name,
        t.projectName,
        t.status,
        '0', // runCount - not yet implemented
        'Never', // lastRunDate - not yet implemented
        t.createdAt.toISOString(),
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tests-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    if (pagination.pageSize !== 20) params.set('pageSize', pagination.pageSize.toString());
    if (filters.search) params.set('search', filters.search);
    if (filters.projectId) params.set('project', filters.projectId);
    if (filters.status) params.set('status', filters.status.join(','));
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    return `/tests?${params.toString()}`;
  };

  if (data.tests.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <div className="text-muted-foreground mb-4 text-5xl">📊</div>
        <h3 className="mb-2 text-lg font-semibold">No Tests Found</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {filters.search || filters.projectId || filters.status
            ? 'Try adjusting your filters or search query'
            : 'Create your first pressure test to get started'}
        </p>
        <Button asChild>
          <Link href={"/tests/new" as any}>Create Test</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Batch Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedIds.size} test{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchExportCSV}
            >
              <FileDownIcon className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDeleteClick}
            >
              <Trash2Icon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === data.tests.length && data.tests.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all tests"
                />
              </TableHead>
              <TableHead>Test Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Runs</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.tests.map((test) => (
              <TableRow key={test.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(test.id)}
                    onCheckedChange={() => toggleSelect(test.id)}
                    aria-label={`Select ${test.testNumber}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/tests/${test.id}` as any}
                    className="hover:underline text-primary"
                  >
                    {test.testNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {test.name}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/projects/${test.projectId}` as any}
                    className="text-muted-foreground hover:underline"
                  >
                    {test.projectName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={statusColors[test.status] ?? 'default'}>
                    {test.status}
                  </Badge>
                </TableCell>
                <TableCell>0</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  Never
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <RelativeTime
                    date={test.createdAt}
                    fallbackFormat="PP p"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                      >
                        <MoreHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/tests/${test.id}` as any}>
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/tests/${test.id}/runs` as any}>
                          <PlayIcon className="mr-2 h-4 w-4" />
                          View Runs
                        </Link>
                      </DropdownMenuItem>
                      {test.latestGraphSize && (
                        <DropdownMenuItem asChild>
                          <Link href={`/api/tests/${test.id}/download` as any}>
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download Graph ({formatBytes(test.latestGraphSize)})
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Share2Icon className="mr-2 h-4 w-4" />
                        Create Share Link
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/tests/${test.id}/duplicate` as any}>
                          <CopyIcon className="mr-2 h-4 w-4" />
                          Duplicate Test
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteClick(test.id, test.testNumber, test.name)}
                      >
                        <Trash2Icon className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {(data.page - 1) * data.pageSize + 1} to{' '}
            {Math.min(data.page * data.pageSize, data.total)} of {data.total} tests
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={data.page <= 1}
            >
              <Link href={buildPageUrl(data.page - 1) as any}>
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Link>
            </Button>
            <span className="text-sm">
              Page {data.page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={data.page >= data.totalPages}
            >
              <Link href={buildPageUrl(data.page + 1) as any}>
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Delete Test Dialog */}
      {testToDelete && (
        <DeleteTestDialog
          testId={testToDelete.id}
          testNumber={testToDelete.number}
          testName={testToDelete.name}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        />
      )}

      {/* Batch Delete Dialog */}
      <BatchDeleteTestsDialog
        testIds={Array.from(selectedIds)}
        open={batchDeleteDialogOpen}
        onOpenChange={setBatchDeleteDialogOpen}
        onSuccess={handleBatchDeleteSuccess}
      />
    </div>
  );
}
