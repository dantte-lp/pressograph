'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
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
  // ArrowUpDownIcon, // Unused - kept for future sorting UI
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
  const { t } = useTranslation();
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
      [
        t('columnTestNumber'),
        t('columnName'),
        t('columnProject'),
        t('columnStatus'),
        t('columnRuns'),
        t('columnLastRun'),
        t('columnCreated'),
      ],
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
        <h3 className="mb-2 text-lg font-semibold">{t('noTests')}</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {filters.search || filters.projectId || filters.status
            ? t('noTestsDescription')
            : t('noTestsDescription')}
        </p>
        <Button asChild>
          <Link href={"/tests/new" as any}>{t('createTest')}</Link>
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
              {t('testsSelected', { count: selectedIds.size })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              {t('clearSelection')}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchExportCSV}
            >
              <FileDownIcon className="mr-2 h-4 w-4" />
              {t('exportCSV')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDeleteClick}
            >
              <Trash2Icon className="mr-2 h-4 w-4" />
              {t('batchDelete')}
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
                  aria-label={t('selectAll')}
                />
              </TableHead>
              <TableHead>{t('columnTestNumber')}</TableHead>
              <TableHead>{t('columnName')}</TableHead>
              <TableHead>{t('columnProject')}</TableHead>
              <TableHead>{t('columnStatus')}</TableHead>
              <TableHead>{t('columnTags')}</TableHead>
              <TableHead>{t('columnRuns')}</TableHead>
              <TableHead>{t('columnLastRun')}</TableHead>
              <TableHead>{t('columnCreated')}</TableHead>
              <TableHead className="text-right">{t('columnActions')}</TableHead>
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
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {test.tags && test.tags.length > 0 ? (
                      test.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                    {test.tags && test.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{test.tags.length - 3}
                      </Badge>
                    )}
                  </div>
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
                          {t('viewDetails')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/tests/${test.id}/runs` as any}>
                          <PlayIcon className="mr-2 h-4 w-4" />
                          {t('viewRuns')}
                        </Link>
                      </DropdownMenuItem>
                      {test.latestGraphSize && (
                        <DropdownMenuItem asChild>
                          <Link href={`/api/tests/${test.id}/download` as any}>
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            {t('downloadGraph')} ({formatBytes(test.latestGraphSize)})
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Share2Icon className="mr-2 h-4 w-4" />
                        {t('createShareLink')}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/tests/${test.id}/duplicate` as any}>
                          <CopyIcon className="mr-2 h-4 w-4" />
                          {t('duplicateAction')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteClick(test.id, test.testNumber, test.name)}
                      >
                        <Trash2Icon className="mr-2 h-4 w-4" />
                        {t('deleteTest')}
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
            {t('showing', {
              from: (data.page - 1) * data.pageSize + 1,
              to: Math.min(data.page * data.pageSize, data.total),
              total: data.total,
            })}
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
                {t('previous')}
              </Link>
            </Button>
            <span className="text-sm">
              {t('page', { current: data.page, total: data.totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={data.page >= data.totalPages}
            >
              <Link href={buildPageUrl(data.page + 1) as any}>
                {t('next')}
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
