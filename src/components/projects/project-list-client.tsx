'use client';

/**
 * Project List Client Component
 *
 * Displays list of projects with error handling and empty states.
 * This is a client component to support interactivity.
 */

import { ProjectCard } from './project-card';
import { ProjectEmpty } from './project-empty';
import type { Project } from '@/lib/db/schema/projects';

interface ProjectListClientProps {
  projects: Project[];
  error: string | null;
  isArchived?: boolean;
}

export function ProjectListClient({
  projects,
  error,
  isArchived = false,
}: ProjectListClientProps) {
  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load projects: {error}
        </p>
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return <ProjectEmpty isArchived={isArchived} />;
  }

  // Render project grid
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
