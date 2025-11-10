'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangleIcon, RefreshCwIcon, ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Error Boundary for Test Detail Page
 *
 * Handles runtime errors with user-friendly messaging and recovery options
 * Improves error resilience and user experience
 */
export default function TestDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service (e.g., Sentry)
    console.error('Test detail page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center p-6 lg:p-8">
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-destructive" aria-hidden="true" />
            <CardTitle>Something Went Wrong</CardTitle>
          </div>
          <CardDescription>
            An error occurred while loading the test details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="mt-2">
              {error.message || 'An unexpected error occurred. Please try again.'}
            </AlertDescription>
            {error.digest && (
              <AlertDescription className="mt-2 text-xs opacity-70">
                Error ID: {error.digest}
              </AlertDescription>
            )}
          </Alert>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>You can try the following:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Refresh the page to reload the test data</li>
              <li>Go back to the tests list and try again</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4" role="group" aria-label="Error recovery actions">
            <Button onClick={reset} className="w-full sm:w-auto">
              <RefreshCwIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/tests">
                <ArrowLeftIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to Tests
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full sm:w-auto">
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
