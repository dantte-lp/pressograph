import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTestById } from '@/lib/actions/tests';
import { RunTestInterfaceClient } from '@/components/tests/run-test-interface-client';
import { Badge } from '@/components/ui/badge';

/**
 * Run Test Page
 *
 * Provides interface for executing a pressure test with:
 * - Real-time status monitoring
 * - Manual measurement input
 * - Live graph updates
 * - Test completion and results calculation
 */

interface RunTestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RunTestPage({ params }: RunTestPageProps) {
  const { id } = await params;

  // Fetch test details
  const test = await getTestById(id);

  if (!test) {
    notFound();
  }

  // Only allow running tests in 'ready' status
  if (test.status !== 'ready') {
    redirect(`/tests/${id}`);
  }

  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/tests" className="hover:text-foreground transition-colors">
          Tests
        </Link>
        <span>/</span>
        <Link href={`/tests/${id}`} className="hover:text-foreground transition-colors">
          {test.testNumber}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Run Test</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Run Test</h1>
            <Badge variant="outline">
              {test.testNumber}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {test.name}
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href={`/tests/${id}`}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Test Details
          </Link>
        </Button>
      </div>

      {/* Warning Notice */}
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <CardTitle className="text-base text-warning">Important Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Ensure all equipment is properly connected and calibrated</li>
            <li>Record measurements at regular intervals as specified in the test plan</li>
            <li>Monitor pressure levels continuously for any sudden changes</li>
            <li>Do not leave the test unattended during critical phases</li>
            <li>Click "Complete Test" only when the test duration has elapsed or if you need to stop early</li>
          </ul>
        </CardContent>
      </Card>

      {/* Run Test Interface */}
      <RunTestInterfaceClient test={test} />
    </div>
  );
}
