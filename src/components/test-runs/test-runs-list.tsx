"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  EyeIcon,
  TrashIcon,
  PlayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FilterIcon
} from "lucide-react";
import { TestRunStatusBadge } from "./test-run-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TestRunListItem } from "@/lib/actions/test-runs";

interface TestRunsListProps {
  runs: TestRunListItem[];
  testId: string;
  isLoading?: boolean;
  onDelete?: (runId: string) => Promise<void>;
}

type SortField = "runNumber" | "startedAt" | "durationSeconds" | "status";
type SortDirection = "asc" | "desc";

export function TestRunsList({ runs, testId, isLoading, onDelete }: TestRunsListProps) {
  const [sortField, setSortField] = useState<SortField>("runNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Sort and filter runs
  const filteredAndSortedRuns = useMemo(() => {
    let filtered = runs;

    // Filter by status
    if (statusFilter.length > 0) {
      filtered = filtered.filter(run => statusFilter.includes(run.status));
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null values
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Convert dates to timestamps for comparison
      if (sortField === "startedAt") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [runs, sortField, sortDirection, statusFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUpIcon className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDownIcon className="ml-1 h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <PlayIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No test runs yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Start your first test run to track measurements and results
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {filteredAndSortedRuns.length} {filteredAndSortedRuns.length === 1 ? "run" : "runs"}
          </Badge>
          {statusFilter.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter([])}
            >
              Clear filters
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filter Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {["scheduled", "in_progress", "completed", "failed", "cancelled"].map(status => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.includes(status)}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev =>
                    checked
                      ? [...prev, status]
                      : prev.filter(s => s !== status)
                  );
                }}
              >
                {status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("runNumber")}
                  className="flex items-center"
                >
                  Run #
                  <SortIcon field="runNumber" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("status")}
                  className="flex items-center"
                >
                  Status
                  <SortIcon field="status" />
                </Button>
              </TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("startedAt")}
                  className="flex items-center"
                >
                  Started
                  <SortIcon field="startedAt" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("durationSeconds")}
                  className="flex items-center"
                >
                  Duration
                  <SortIcon field="durationSeconds" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedRuns.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/tests/${testId}/runs/${run.id}`}
                    className="hover:underline"
                  >
                    #{run.runNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <TestRunStatusBadge status={run.status} />
                </TableCell>
                <TableCell>{run.operatorName}</TableCell>
                <TableCell>
                  {run.startedAt ? (
                    <span title={new Date(run.startedAt).toLocaleString()}>
                      {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not started</span>
                  )}
                </TableCell>
                <TableCell>
                  {formatDuration(run.durationSeconds)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <Link href={`/tests/${testId}/runs/${run.id}`}>
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                    {onDelete && (run.status === "scheduled" || run.status === "cancelled") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(run.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
