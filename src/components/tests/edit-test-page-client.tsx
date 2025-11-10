'use client';

/**
 * Edit Test Page Client Component
 *
 * Client-side wrapper for the edit test page with i18n support
 *
 * Features:
 * - i18n support using useTranslation hook
 * - Breadcrumb navigation
 * - Edit test form with pre-populated data
 */

import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditTestFormClient } from '@/components/tests/edit-test-form-client';

interface EditTestPageClientProps {
  test: {
    id: string;
    testNumber: string;
    status: string;
    // Add other test properties as needed
    [key: string]: any;
  };
}

export function EditTestPageClient({ test }: EditTestPageClientProps) {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/tests" className="hover:text-foreground transition-colors">
          {t('tests.title')}
        </Link>
        <span>/</span>
        <Link href={`/tests/${test.id}`} className="hover:text-foreground transition-colors">
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
          <Link href={`/tests/${test.id}`}>
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
