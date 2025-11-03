import { trace, SpanStatusCode, Span } from '@opentelemetry/api';

const tracer = trace.getTracer('pressograph-tracer');

/**
 * Wrapper to trace async functions
 *
 * @example
 * ```typescript
 * const result = await traceAsync('fetchUserData', async () => {
 *   return await db.query.users.findFirst({ where: eq(users.id, userId) });
 * }, { userId });
 * ```
 */
export function traceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  return tracer.startActiveSpan(name, async (span: Span) => {
    if (attributes) {
      span.setAttributes(attributes);
    }

    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Wrapper to trace sync functions
 *
 * @example
 * ```typescript
 * const result = traceSync('calculatePressure', () => {
 *   return workingPressure * 1.5;
 * }, { workingPressure });
 * ```
 */
export function traceSync<T>(
  name: string,
  fn: () => T,
  attributes?: Record<string, string | number | boolean>
): T {
  return tracer.startActiveSpan(name, (span: Span) => {
    if (attributes) {
      span.setAttributes(attributes);
    }

    try {
      const result = fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Create a new span manually (for more complex scenarios)
 *
 * @example
 * ```typescript
 * const span = createSpan('complexOperation', { userId: '123' });
 * try {
 *   // Do work
 *   span.addEvent('milestone_reached', { step: 1 });
 *   // More work
 *   span.end();
 * } catch (error) {
 *   span.recordException(error as Error);
 *   span.setStatus({ code: SpanStatusCode.ERROR });
 *   span.end();
 *   throw error;
 * }
 * ```
 */
export function createSpan(
  name: string,
  attributes?: Record<string, string | number | boolean>
): Span {
  const span = tracer.startSpan(name);

  if (attributes) {
    span.setAttributes(attributes);
  }

  return span;
}

/**
 * Get the current active span (useful for adding events or attributes)
 */
export function getActiveSpan(): Span | undefined {
  return trace.getActiveSpan();
}

/**
 * Add an event to the current active span
 */
export function addEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>
): void {
  const span = getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Set attributes on the current active span
 */
export function setAttributes(
  attributes: Record<string, string | number | boolean>
): void {
  const span = getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}
