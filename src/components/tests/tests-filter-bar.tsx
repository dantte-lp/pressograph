'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import {
  FilterIcon,
  SearchIcon,
  XIcon,
  ChevronDownIcon,
  ArrowUpDownIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface TestsFilterBarProps {
  projects?: Array<{ id: string; name: string }>;
  totalTests?: number;
}

const TEST_STATUSES = [
  'draft',
  'ready',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;

// Sort options for tests (unused but kept for future UI enhancement)
// const SORT_OPTIONS = [
//   'newest',
//   'oldest',
//   'testNumber',
//   'name',
//   'nameDesc',
//   'lastRun',
//   'runCount',
// ] as const;

/**
 * TestsFilterBar Component
 *
 * Provides comprehensive filtering, searching, and sorting for the tests table.
 *
 * Features:
 * - Search with debounce (500ms)
 * - Multi-select status filter
 * - Project filter
 * - Sort options
 * - Active filter badges
 * - Clear all filters
 * - URL state management
 */
export function TestsFilterBar({ projects = [], totalTests = 0 }: TestsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  // State
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [selectedProject, setSelectedProject] = useState(searchParams.get('project') || 'all');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    searchParams.get('status')?.split(',').filter(Boolean) || []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL({ search: searchValue || undefined });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Build URL with filters
  const buildURL = useCallback((params: Record<string, string | undefined>) => {
    const url = new URLSearchParams();

    // Always reset to page 1 when filters change
    url.set('page', '1');

    // Add current params
    if (params.search) url.set('search', params.search);
    if (params.project && params.project !== 'all') url.set('project', params.project);
    if (params.status && params.status.length > 0) url.set('status', params.status);
    if (params.sortBy && params.sortBy !== 'newest') url.set('sortBy', params.sortBy);

    return `/tests?${url.toString()}`;
  }, []);

  // Update URL
  const updateURL = useCallback((newParams: Record<string, string | undefined>) => {
    const params = {
      search: newParams.search !== undefined ? newParams.search : searchValue,
      project: newParams.project !== undefined ? newParams.project : selectedProject,
      status: newParams.status !== undefined ? newParams.status : selectedStatuses.join(','),
      sortBy: newParams.sortBy !== undefined ? newParams.sortBy : sortBy,
    };

    router.push(buildURL(params) as any);
  }, [searchValue, selectedProject, selectedStatuses, sortBy, buildURL, router]);

  // Handle status toggle
  const toggleStatus = (status: string) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];

    setSelectedStatuses(newStatuses);
    updateURL({ status: newStatuses.join(',') || undefined });
  };

  // Handle project change
  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    updateURL({ project: value === 'all' ? undefined : value });
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateURL({ sortBy: value === 'newest' ? undefined : value });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchValue('');
    setSelectedProject('all');
    setSelectedStatuses([]);
    setSortBy('newest');
    router.push('/tests?page=1');
  };

  // Count active filters
  const activeFiltersCount = [
    searchValue ? 1 : 0,
    selectedProject !== 'all' ? 1 : 0,
    selectedStatuses.length > 0 ? 1 : 0,
    sortBy !== 'newest' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('searchTests')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDownIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t('sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t('sortNewest')}</SelectItem>
              <SelectItem value="oldest">{t('sortOldest')}</SelectItem>
              <SelectItem value="testNumber">{t('sortTestNumber')}</SelectItem>
              <SelectItem value="name">{t('sortName')}</SelectItem>
              <SelectItem value="nameDesc">{t('sortNameDesc')}</SelectItem>
              <SelectItem value="lastRun">{t('sortLastRun')}</SelectItem>
              <SelectItem value="runCount">{t('sortRunCount')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Filters Popover */}
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <FilterIcon className="mr-2 h-4 w-4" />
                {t('filters')}
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 min-w-5 rounded-full px-1 text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{t('filters')}</h4>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                    >
                      {t('clearFilters')}
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Project Filter */}
                <div className="space-y-2">
                  <Label htmlFor="project-filter">{t('filterByProject')}</Label>
                  <Select
                    value={selectedProject}
                    onValueChange={handleProjectChange}
                  >
                    <SelectTrigger id="project-filter">
                      <SelectValue placeholder={t('allProjects')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allProjects')}</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>{t('filterByStatus')}</Label>
                  <div className="space-y-2">
                    {TEST_STATUSES.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={() => toggleStatus(status)}
                        />
                        <label
                          htmlFor={`status-${status}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {t(`status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear Filters Button (only show when filters active) */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="hidden sm:flex"
            >
              <XIcon className="mr-2 h-4 w-4" />
              {t('clearFilters')}
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('activeFilters', { count: activeFiltersCount })}:
          </span>

          {searchValue && (
            <Badge variant="secondary" className="gap-1">
              {t('common.search')}: {searchValue}
              <button
                onClick={() => setSearchValue('')}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {selectedProject !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {t('project')}: {projects.find(p => p.id === selectedProject)?.name}
              <button
                onClick={() => handleProjectChange('all')}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {selectedStatuses.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {t(`status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
              <button
                onClick={() => toggleStatus(status)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {sortBy !== 'newest' && (
            <Badge variant="secondary" className="gap-1">
              {t('sortBy')}: {t(`sort${sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}`)}
              <button
                onClick={() => handleSortChange('newest')}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Summary */}
      {totalTests !== undefined && (
        <div className="text-sm text-muted-foreground">
          {activeFiltersCount > 0 ? (
            <>
              {totalTests} {totalTests === 1 ? 'test' : 'tests'} found
            </>
          ) : (
            <>
              {totalTests} total {totalTests === 1 ? 'test' : 'tests'}
            </>
          )}
        </div>
      )}
    </div>
  );
}
