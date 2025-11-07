import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderIcon,
  PlusIcon,
  SettingsIcon,
  ArchiveIcon,
  CalendarIcon,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { getProjectById } from '@/lib/actions/projects';
import { TestsTable } from '@/components/tests/tests-table';
import { TestsTableSkeleton } from '@/components/tests/tests-table-skeleton';
import { formatDistanceToNow } from 'date-fns';

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
  searchParams: {
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    sortBy?: string;
  };
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const project = await getProjectById(params.id);

  if (!project) {
    notFound();
  }

  // Parse search params for tests table
  const page = parseInt(searchParams.page ?? '1', 10);
  const pageSize = parseInt(searchParams.pageSize ?? '20', 10);
  const search = searchParams.search;
  const status = searchParams.status?.split(',').filter(Boolean);
  const sortBy = searchParams.sortBy as 'newest' | 'oldest' | 'testNumber' | 'name' | undefined;

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground flex items-center gap-2 text-sm">
        <Link href="/projects" className="hover:text-foreground">
          Projects
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
                Archived
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
              Create Test
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}/settings` as any}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
            <UserIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.ownerName}</div>
            <p className="text-muted-foreground text-xs">Project owner</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <CalendarIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDistanceToNow(project.createdAt, { addSuffix: true })}
            </div>
            <p className="text-muted-foreground text-xs">
              {project.createdAt.toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Number Prefix</CardTitle>
            <FolderIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.settings?.testNumberPrefix || 'PT-'}
            </div>
            <p className="text-muted-foreground text-xs">
              Auto-numbering: {project.settings?.autoNumberTests ? 'Enabled' : 'Disabled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tests in Project */}
      <Card>
        <CardHeader>
          <CardTitle>Tests in this Project</CardTitle>
          <CardDescription>
            All pressure tests associated with {project.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TestsTableSkeleton />}>
            <TestsTable
              page={page}
              pageSize={pageSize}
              search={search}
              projectId={project.id}
              status={status}
              sortBy={sortBy}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
