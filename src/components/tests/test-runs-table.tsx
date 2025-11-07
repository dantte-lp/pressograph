import Link from 'next/link';
import { CheckCircle2Icon, XCircleIcon, LoaderIcon, ClockIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getTestRuns } from '@/lib/actions/tests';

interface TestRunsTableProps {
  testId: string;
  page?: number;
  pageSize?: number;
}

export async function TestRunsTable({
  testId,
  page = 1,
  pageSize = 20,
}: TestRunsTableProps) {
  const { runs, total, totalPages } = await getTestRuns(testId, { page, pageSize });

  if (runs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No test runs found</p>
      </div>
    );
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusBadge = (status: string, passed: boolean | null) => {
    if (status === 'completed') {
      if (passed === true) {
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            <CheckCircle2Icon className="mr-1 h-3 w-3" />
            Passed
          </Badge>
        );
      } else if (passed === false) {
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
            <XCircleIcon className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      }
    }

    if (status === 'running') {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
          <LoaderIcon className="mr-1 h-3 w-3 animate-spin" />
          Running
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <ClockIcon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Started</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-medium">
                  {run.startedAt.toLocaleString()}
                </TableCell>
                <TableCell>
                  {run.completedAt ? run.completedAt.toLocaleString() : 'In progress'}
                </TableCell>
                <TableCell>{formatDuration(run.duration)}</TableCell>
                <TableCell>{run.executedByName}</TableCell>
                <TableCell>{getStatusBadge(run.status, run.passed)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/tests/${testId}/runs/${run.id}` as any}>
                      View Details
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} ({total} total runs)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild={page > 1}
              disabled={page <= 1}
            >
              <Link href={`?page=${page - 1}`}>Previous</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild={page < totalPages}
              disabled={page >= totalPages}
            >
              <Link href={`?page=${page + 1}`}>Next</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
