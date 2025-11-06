'use client';

/**
 * App Router Error Page
 *
 * This page is displayed when an error occurs during rendering.
 * It replaces the Pages Router _error.js pattern.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Application Error</CardTitle>
          </div>
          <CardDescription>
            The application encountered an unexpected error
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 text-sm font-semibold">Error Details:</p>
              <p className="text-sm text-destructive">{error.message}</p>
              {error.digest && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Error ID: {error.digest}
                </p>
              )}
              {error.stack && (
                <pre className="mt-2 max-h-40 overflow-auto text-xs text-muted-foreground">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          {/* Production Error Message */}
          {process.env.NODE_ENV === 'production' && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                An unexpected error occurred. Our team has been notified.
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Reference ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={reset} variant="default">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => (window.location.href = '/')} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-sm text-muted-foreground">
            If this problem persists, please contact support or try again later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
