'use client';

/**
 * Test Filters Component
 *
 * Advanced filtering UI for the tests page with multiple filter criteria.
 * Implements Issue #100 - Advanced test filtering.
 *
 * Features:
 * - Multi-select status filters (Pending, In Progress, Completed, Failed)
 * - Date range picker for test creation/execution dates
 * - Tag-based filtering
 * - Project-based filtering
 * - Search by test name/description
 * - Clear all filters button
 * - Active filter indicators
 *
 * @module components/tests/test-filters
 */

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  FilterIcon,
  XIcon,
  SearchIcon,
  CalendarIcon,
  TagIcon,
  FolderIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Available test statuses for filtering
 */
const TEST_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { value: 'ready', label: 'Ready', color: 'bg-blue-500' },
  { value: 'running', label: 'Running', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-orange-500' },
] as const;

interface TestFiltersProps {
  /** Available projects for filtering */
  projects?: Array<{ id: string; name: string }>;
  /** Available tags for filtering */
  tags?: string[];
  /** Show compact version (horizontal layout) */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

export function TestFilters({
  projects = [],
  tags = [],
  compact: _compact = false,
  className,
}: TestFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current filters from URL
  const currentSearch = searchParams.get('search') || '';
  const currentStatuses = searchParams.get('status')?.split(',').filter(Boolean) || [];
  const currentProject = searchParams.get('project') || '';
  const currentTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
  const currentDateFrom = searchParams.get('dateFrom') || '';
  const currentDateTo = searchParams.get('dateTo') || '';

  // Local state for filters
  const [search, setSearch] = useState(currentSearch);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(currentStatuses);
  const [selectedProject, setSelectedProject] = useState(currentProject);
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);
  const [dateFrom, setDateFrom] = useState(currentDateFrom);
  const [dateTo, setDateTo] = useState(currentDateTo);

  // Open states for popovers
  const [statusOpen, setStatusOpen] = useState(false);
  const [_projectOpen, _setProjectOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  /**
   * Apply filters to URL search params
   */
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Set or remove search param
    if (search.trim()) {
      params.set('search', search.trim());
    } else {
      params.delete('search');
    }

    // Set or remove status filter
    if (selectedStatuses.length > 0) {
      params.set('status', selectedStatuses.join(','));
    } else {
      params.delete('status');
    }

    // Set or remove project filter
    if (selectedProject) {
      params.set('project', selectedProject);
    } else {
      params.delete('project');
    }

    // Set or remove tags filter
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
    } else {
      params.delete('tags');
    }

    // Set or remove date range filters
    if (dateFrom) {
      params.set('dateFrom', dateFrom);
    } else {
      params.delete('dateFrom');
    }

    if (dateTo) {
      params.set('dateTo', dateTo);
    } else {
      params.delete('dateTo');
    }

    // Reset to page 1 when filters change
    params.set('page', '1');

    // Update URL
    router.push(`?${params.toString()}`);
  }, [search, selectedStatuses, selectedProject, selectedTags, dateFrom, dateTo, router, searchParams]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedStatuses([]);
    setSelectedProject('');
    setSelectedTags([]);
    setDateFrom('');
    setDateTo('');

    // Navigate to clean URL
    router.push('?page=1');
  }, [router]);

  /**
   * Toggle status selection
   */
  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  /**
   * Toggle tag selection
   */
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  /**
   * Count active filters
   */
  const activeFilterCount =
    (search ? 1 : 0) +
    (selectedStatuses.length > 0 ? 1 : 0) +
    (selectedProject ? 1 : 0) +
    (selectedTags.length > 0 ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0);

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search-filter" className="text-sm font-medium">
            Search Tests
          </Label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-filter"
              type="text"
              placeholder="Search by name, number, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFilters();
                }
              }}
              className="pl-10"
            />
          </div>
        </div>

        <Separator />

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <Popover open={statusOpen} onOpenChange={setStatusOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={statusOpen}
                className="w-full justify-between"
              >
                <span className="truncate">
                  {selectedStatuses.length > 0
                    ? `${selectedStatuses.length} selected`
                    : 'All statuses'}
                </span>
                <FilterIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4" align="start">
              <div className="space-y-3">
                {TEST_STATUSES.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={() => toggleStatus(status.value)}
                    />
                    <label
                      htmlFor={`status-${status.value}`}
                      className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <div className={cn('h-2 w-2 rounded-full', status.color)} />
                      <span>{status.label}</span>
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Project Filter */}
        {projects.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="project-filter" className="text-sm font-medium">
              <FolderIcon className="inline-block h-4 w-4 mr-1" />
              Project
            </Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger id="project-filter" className="w-full">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tags Filter */}
        {tags.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              <TagIcon className="inline-block h-4 w-4 mr-1" />
              Tags
            </Label>
            <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={tagsOpen}
                  className="w-full justify-between"
                >
                  <span className="truncate">
                    {selectedTags.length > 0
                      ? `${selectedTags.length} selected`
                      : 'All tags'}
                  </span>
                  <FilterIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-4 max-h-[300px] overflow-y-auto" align="start">
                <div className="space-y-3">
                  {tags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => toggleTag(tag)}
                      />
                      <label
                        htmlFor={`tag-${tag}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <Badge variant="secondary" className="font-normal">
                          {tag}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            <CalendarIcon className="inline-block h-4 w-4 mr-1" />
            Creation Date Range
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From"
              className="text-sm"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To"
              className="text-sm"
            />
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={applyFilters} className="flex-1">
            <FilterIcon className="mr-2 h-4 w-4" />
            Apply Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 rounded-full px-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button onClick={clearFilters} variant="outline" size="icon">
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {search && (
                  <Badge variant="outline" className="gap-1">
                    Search: {search}
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedStatuses.map((status) => {
                  const statusObj = TEST_STATUSES.find((s) => s.value === status);
                  return (
                    <Badge key={status} variant="outline" className="gap-1">
                      <div className={cn('h-2 w-2 rounded-full', statusObj?.color)} />
                      {statusObj?.label}
                      <button
                        type="button"
                        onClick={() => toggleStatus(status)}
                        className="ml-1 rounded-full hover:bg-muted"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
                {selectedProject && (
                  <Badge variant="outline" className="gap-1">
                    Project: {projects.find((p) => p.id === selectedProject)?.name}
                    <button
                      type="button"
                      onClick={() => setSelectedProject('')}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="gap-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(dateFrom || dateTo) && (
                  <Badge variant="outline" className="gap-1">
                    {dateFrom && `From: ${format(new Date(dateFrom), 'MMM d, yyyy')}`}
                    {dateFrom && dateTo && ' - '}
                    {dateTo && `To: ${format(new Date(dateTo), 'MMM d, yyyy')}`}
                    <button
                      type="button"
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
