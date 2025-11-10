/**
 * Projects Page (Server Component)
 *
 * Displays all projects for the authenticated user.
 * Allows creating, editing, archiving, and deleting projects.
 *
 * Query Parameters:
 * - archived: 'true' to show only archived projects, 'false' or omitted for active projects
 */

import { getProjects } from '@/lib/actions/projects';
import { ProjectsPageClient } from '@/components/projects/projects-page-client';

export const metadata = {
  title: 'Projects | Pressograph',
  description: 'Manage your pressure test projects',
};

interface ProjectsPageProps {
  searchParams: Promise<{
    archived?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  // Parse search params (await Promise in Next.js 15+)
  const params = await searchParams;
  const showArchived = params.archived === 'true';

  // Fetch projects on the server
  const { projects, error } = await getProjects({ isArchived: showArchived });

  return (
    <ProjectsPageClient
      initialProjects={projects || []}
      error={error}
      showArchived={showArchived}
    />
  );
}
