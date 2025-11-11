'use client';

/**
 * Create Test Page Client Component
 *
 * Wraps the create test UI with i18n support
 */

import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateTestForm } from '@/components/tests/create-test-form';
import { useTranslation } from '@/hooks/use-translation';
import type { Project } from '@/lib/db/schema/projects';

interface CreateTestPageClientProps {
  projects: Project[];
  projectsError?: string | null;
  sourceTest?: any;
  userId: string;
  organizationId?: string;
}

export function CreateTestPageClient({
  projects,
  projectsError,
  sourceTest,
  userId,
  organizationId,
}: CreateTestPageClientProps) {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/tests" className="hover:text-foreground transition-colors">
          {t('tests.title')}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {sourceTest
            ? t('tests.duplicateTest', { number: sourceTest.testNumber })
            : t('tests.createNewTest')}
        </span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {sourceTest ? t('tests.duplicateTest_title') : t('tests.createNewTest')}
          </h1>
          <p className="text-muted-foreground">
            {sourceTest
              ? t('tests.duplicateDescription', {
                  number: sourceTest.testNumber,
                  name: sourceTest.name,
                })
              : t('tests.createDescription')}
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/tests">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            {t('tests.backToTests')}
          </Link>
        </Button>
      </div>

      {/* Error State */}
      {projectsError && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t('tests.errorLoadingProjects')}
            </CardTitle>
            <CardDescription>
              {t('tests.errorLoadingProjectsDescription')}
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
            <CardTitle>{t('tests.noProjectsAvailable')}</CardTitle>
            <CardDescription>
              {t('tests.noProjectsAvailableDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/projects">{t('tests.goToProjects')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Test Form */}
      {!projectsError && projects.length > 0 && organizationId && (
        <CreateTestForm
          projects={projects}
          sourceTest={sourceTest}
          userId={userId}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}
