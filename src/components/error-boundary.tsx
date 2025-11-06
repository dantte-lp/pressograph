'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'root' | 'page' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in child component tree
 * Logs errors and displays fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to an error reporting service like Sentry
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      // Default fallback UI based on level
      return (
        <DefaultErrorFallback
          error={this.state.error}
          reset={this.reset}
          level={this.props.level || 'component'}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback UI
 */
function DefaultErrorFallback({
  error,
  reset,
  level,
}: {
  error: Error;
  reset: () => void;
  level: 'root' | 'page' | 'component';
}) {
  const isRootLevel = level === 'root';
  const isPageLevel = level === 'page';

  return (
    <div
      className={`flex items-center justify-center ${
        isRootLevel ? 'min-h-screen bg-background' : isPageLevel ? 'min-h-[400px]' : 'min-h-[200px]'
      }`}
    >
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>
              {isRootLevel ? 'Application Error' : isPageLevel ? 'Page Error' : 'Something went wrong'}
            </CardTitle>
          </div>
          <CardDescription>
            {isRootLevel
              ? 'The application encountered an unexpected error'
              : isPageLevel
                ? 'This page encountered an error while loading'
                : 'This component encountered an error'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 text-sm font-semibold">Error Details:</p>
              <p className="text-sm text-destructive">{error.message}</p>
              {error.stack && (
                <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
                  {error.stack.split('\n').slice(0, 5).join('\n')}
                </pre>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={reset} variant="default">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            {isPageLevel && (
              <Button onClick={() => (window.location.href = '/')} variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            )}
            {isRootLevel && (
              <Button onClick={() => window.location.reload()} variant="outline">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            )}
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

/**
 * Root Error Boundary
 * For wrapping the entire application
 */
export function RootErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="root"
      onError={(error, errorInfo) => {
        console.error('Root level error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Page Error Boundary
 * For wrapping individual pages
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="page"
      onError={(error, errorInfo) => {
        console.error('Page level error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Component Error Boundary
 * For wrapping individual components
 */
export function ComponentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="component"
      onError={(error, errorInfo) => {
        console.error('Component level error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
