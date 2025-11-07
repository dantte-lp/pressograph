/**
 * Project List Component (Server Component)
 *
 * Fetches and displays all projects for the current user.
 * Uses server-side data fetching for optimal performance.
 */

import { getProjects } from '@/lib/actions/projects';
import { ProjectCard } from './project-card';
import { ProjectEmpty } from './project-empty';

interface ProjectListProps {
  isArchived?: boolean;
}

export async function ProjectList({ isArchived = false }: ProjectListProps) {
  const { projects, error } = await getProjects({ isArchived });

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load projects: {error}
        </p>
      </div>
    );
  }

  if (projects.length === 0) {
    return <ProjectEmpty isArchived={isArchived} />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
