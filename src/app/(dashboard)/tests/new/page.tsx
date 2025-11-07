import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { requireAuth } from '@/lib/auth/server-auth';
import { getProjects } from '@/lib/actions/projects';
import { getTestById } from '@/lib/actions/tests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateTestForm } from '@/components/tests/create-test-form';
import { Spinner } from '@/components/ui/spinner';

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
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/tests" className="hover:text-foreground transition-colors">
          Tests
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {sourceTest ? `Duplicate: ${sourceTest.testNumber}` : 'Create New Test'}
        </span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {sourceTest ? 'Duplicate Test' : 'Create New Test'}
          </h1>
          <p className="text-muted-foreground">
            {sourceTest
              ? `Creating a copy of test ${sourceTest.testNumber}: ${sourceTest.name}`
              : 'Configure and create a new pressure test'}
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/tests">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Tests
          </Link>
        </Button>
      </div>

      {/* Error State */}
      {projectsError && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Projects</CardTitle>
            <CardDescription>
              Unable to load projects. Please try again or contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{projectsError}</p>
          </CardContent>
        </Card>
      )}

      {/* No Projects State */}
      {!projectsError && projects.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Projects Available</CardTitle>
            <CardDescription>
              You need to create a project before creating tests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/projects">Go to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Test Form */}
      {!projectsError && projects.length > 0 && (
        <Suspense fallback={<FormLoadingSkeleton />}>
          <CreateTestForm
            projects={projects}
            sourceTest={sourceTest}
            userId={session.user.id}
            organizationId={session.user.organizationId || ''}
          />
        </Suspense>
      )}
    </div>
  );
}

/**
 * Loading skeleton for form
 */
function FormLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </CardHeader>
    </Card>
  );
}
