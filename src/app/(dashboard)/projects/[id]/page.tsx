import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderIcon,
  PlusIcon,
  ArchiveIcon,
  CalendarIcon,
  UserIcon,
  SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';
import { getProjectById } from '@/lib/actions/projects';
import { getTests, getAllTags } from '@/lib/actions/tests';
import type { TestFilters, PaginationParams } from '@/lib/actions/tests';
import { TestsTableClient } from '@/components/tests/tests-table-client';
import { formatDate, formatRelativeTime } from '@/lib/utils/format';

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    sortBy?: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  // Await params and searchParams (Next.js 16+)
  const { id } = await params;
  const searchParamsResolved = await searchParams;

  const t = await getTranslations('projects');

  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  // Parse search params for tests table
  const page = parseInt(searchParamsResolved.page ?? '1', 10);
  const pageSize = parseInt(searchParamsResolved.pageSize ?? '20', 10);
  const search = searchParamsResolved.search;
  const status = searchParamsResolved.status?.split(',').filter(Boolean);
  const sortBy = searchParamsResolved.sortBy as 'newest' | 'oldest' | 'testNumber' | 'name' | undefined;

  // Build filters for tests query
  const filters: TestFilters = {
    search,
    projectId: project.id, // Filter tests by this project
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

  // Fetch available tags
  const availableTags = await getAllTags();

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground flex items-center gap-2 text-sm">
        <Link href="/projects" className="hover:text-foreground">
          {t('title')}
        </Link>
        <span>/</span>
        <span className="text-foreground">{project.name}</span>
      </nav>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            {project.isArchived && (
              <Badge variant="outline">
                <ArchiveIcon className="mr-1 h-3 w-3" />
                {t('archived')}
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="text-muted-foreground text-lg">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/tests/new?project=${project.id}` as any}>
              <PlusIcon className="mr-2 h-4 w-4" />
              {t('createTest')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}/settings` as any}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              {t('settings')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('owner')}</CardTitle>
            <UserIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.ownerName}</div>
            <p className="text-muted-foreground text-xs">{t('projectOwner')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('created')}</CardTitle>
            <CalendarIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRelativeTime(project.createdAt)}
            </div>
            <p className="text-muted-foreground text-xs">
              {formatDate(project.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('testNumberPrefix')}</CardTitle>
            <FolderIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.settings?.testNumberPrefix || 'PT-'}
            </div>
            <p className="text-muted-foreground text-xs">
              {t('autoNumbering')}: {project.settings?.autoNumberTests ? t('enabled') : t('disabled')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tests in Project */}
      <Card>
        <CardHeader>
          <CardTitle>{t('testsInProject')}</CardTitle>
          <CardDescription>
            {t('testsInProjectDescription', { projectName: project.name })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TestsTableClient
            data={testsData}
            filters={filters}
            pagination={paginationParams}
            availableTags={availableTags}
          />
        </CardContent>
      </Card>
    </div>
  );
}
