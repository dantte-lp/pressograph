import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectList } from '@/components/projects/project-list';
import { ProjectListSkeleton } from '@/components/projects/project-list-skeleton';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';

/**
 * Projects Page
 *
 * Displays all projects for the authenticated user.
 * Allows creating, editing, archiving, and deleting projects.
 */
export default function ProjectsPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Organize your pressure tests into projects
          </p>
        </div>

        {/* Create Project Button */}
        <CreateProjectDialog>
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Project
          </Button>
        </CreateProjectDialog>
      </div>

      {/* Project List */}
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList />
      </Suspense>
    </div>
  );
}
