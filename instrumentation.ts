/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically loaded by Next.js before the server starts.
 * It's the perfect place to initialize OpenTelemetry and other instrumentation.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only initialize on Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only enable in production or when explicitly enabled
    const isEnabled =
      process.env.OTEL_ENABLED === 'true' ||
      process.env.NODE_ENV === 'production';

    if (isEnabled) {
      const { startOpenTelemetry } = await import('./src/lib/observability/otel');
      startOpenTelemetry();
    } else {
      console.log('📊 OpenTelemetry disabled (set OTEL_ENABLED=true to enable)');
    }
  }
}

/**
 * Optional: Called when a new request comes in
 * This is experimental and only works with certain Next.js configurations
 */
export async function onRequestError(
  error: Error,
  request: {
    path: string;
    method: string;
    headers: Headers;
  }
) {
  // Log error for monitoring (can be enhanced with Sentry, etc.)
  console.error('Request error:', {
    error: error.message,
    path: request.path,
    method: request.method,
  });
}
