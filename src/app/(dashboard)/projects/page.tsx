'use client';

import React, { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ProjectList } from '@/components/projects/project-list';
import { ProjectListSkeleton } from '@/components/projects/project-list-skeleton';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';

/**
 * Projects Page
 *
 * Displays all projects for the authenticated user.
 * Allows creating, editing, archiving, and deleting projects.
 *
 * Query Parameters:
 * - archived: 'true' to show only archived projects, 'false' or omitted for active projects
 */

interface ProjectsPageProps {
  searchParams: Promise<{
    archived?: string;
  }>;
}

export default function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { t } = useTranslation();

  // Parse search params (await Promise in Next.js 16+)
  const [params, setParams] = React.useState<{ archived?: string }>({});

  React.useEffect(() => {
    searchParams.then(setParams);
  }, [searchParams]);

  const showArchived = params.archived === 'true';

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {showArchived ? t('projects.archivedProjects') : t('projects.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {showArchived
              ? t('projects.viewAndRestoreArchived')
              : t('projects.organizeYourTests')}
          </p>
        </div>

        {/* Create Project Button */}
        <CreateProjectDialog>
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            {t('projects.newProject')}
          </Button>
        </CreateProjectDialog>
      </div>

      {/* Project List */}
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList isArchived={showArchived} />
      </Suspense>
    </div>
  );
}
