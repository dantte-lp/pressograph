import { requireAuth } from '@/lib/auth/server-auth';
import { getProjects } from '@/lib/actions/projects';
import { getTestById } from '@/lib/actions/tests';
import { CreateTestPageClient } from '@/components/tests/create-test-page-client';

/**
 * Create New Test Page
 *
 * Multi-step wizard for creating new pressure tests:
 * - Step 1: Basic Information (name, project, description, tags)
 * - Step 2: Core Parameters (equipment, pressure settings, durations)
 * - Step 3: Intermediate Stages (optional pressure steps)
 * - Step 4: Review & Create
 *
 * Supports duplication via ?duplicate={testId} query parameter
 */

interface CreateTestPageProps {
  searchParams: Promise<{
    duplicate?: string;
  }>;
}

export default async function CreateTestPage({ searchParams }: CreateTestPageProps) {
  const session = await requireAuth();
  const params = await searchParams;

  // Fetch projects for dropdown
  const { projects, error: projectsError } = await getProjects();

  // If duplicating, fetch the source test
  let sourceTest = null;
  if (params.duplicate) {
    try {
      sourceTest = await getTestById(params.duplicate);
    } catch (error) {
      console.error('Error fetching test to duplicate:', error);
    }
  }

  return (
    <CreateTestPageClient
      projects={projects}
      projectsError={projectsError}
      sourceTest={sourceTest}
      userId={session.user.id}
      organizationId={session.user.organizationId || ''}
    />
  );
}
