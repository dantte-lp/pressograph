import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTestById } from '@/lib/actions/tests';
import { EditTestFormClient } from '@/components/tests/edit-test-form-client';

/**
 * Edit Test Page
 *
 * Allows users to modify an existing pressure test configuration.
 * Uses the same form component as create test but pre-populates with existing data.
 */

interface EditTestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTestPage({ params }: EditTestPageProps) {
  const { id } = await params;
  const t = await getTranslations();

  // Fetch test details
  const test = await getTestById(id);

  if (!test) {
    notFound();
  }

  // Only allow editing tests in 'draft' or 'ready' status
  if (!['draft', 'ready'].includes(test.status)) {
    redirect(`/tests/${id}`);
  }

  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/tests" className="hover:text-foreground transition-colors">
          {t('tests.title')}
        </Link>
        <span>/</span>
        <Link href={`/tests/${id}`} className="hover:text-foreground transition-colors">
          {test.testNumber}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{t('common.edit')}</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('tests.editTest')}</h1>
          <p className="text-muted-foreground">
            {t('tests.modifyConfiguration', { testNumber: test.testNumber })}
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href={`/tests/${id}`}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            {t('tests.backToTest')}
          </Link>
        </Button>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tests.testConfiguration')}</CardTitle>
          <CardDescription>
            {t('tests.updateParameters')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditTestFormClient test={test} />
        </CardContent>
      </Card>
    </div>
  );
}
