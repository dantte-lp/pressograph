'use client';

/**
 * Global Error Page
 *
 * This page is displayed for errors in the root layout.
 * It must define its own <html> and <body> tags.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
            <p className="text-lg text-gray-600 mb-8">
              A critical error occurred. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-8 p-4 bg-red-50 rounded-lg text-left">
                <p className="font-mono text-sm text-red-600">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="font-mono text-xs text-gray-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
