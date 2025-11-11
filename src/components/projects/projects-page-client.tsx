'use client';

/**
 * Projects Page Client Component
 *
 * Client-side wrapper for projects page with i18n and interactivity.
 * Receives server-fetched data and handles client-side UI state.
 */

import { Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { ProjectListClient } from '@/components/projects/project-list-client';
import type { Project } from '@/lib/db/schema/projects';

interface ProjectsPageClientProps {
  initialProjects: Project[];
  error: string | null;
  showArchived: boolean;
}

export function ProjectsPageClient({
  initialProjects,
  error,
  showArchived,
}: ProjectsPageClientProps) {
  const { t } = useTranslation();

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
        {!showArchived && (
          <CreateProjectDialog>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              {t('projects.newProject')}
            </Button>
          </CreateProjectDialog>
        )}
      </div>

      {/* Project List */}
      <ProjectListClient
        projects={initialProjects}
        error={error}
        isArchived={showArchived}
      />
    </div>
  );
}
