import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('pressograph-metrics');

// Counter: Total HTTP requests
export const httpRequestsTotal = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
  unit: '1',
});

// Histogram: HTTP request duration
export const httpRequestDuration = meter.createHistogram('http_request_duration_seconds', {
  description: 'HTTP request duration in seconds',
  unit: 's',
});

// Counter: Database queries
export const dbQueriesTotal = meter.createCounter('db_queries_total', {
  description: 'Total number of database queries',
  unit: '1',
});

// Histogram: Database query duration
export const dbQueryDuration = meter.createHistogram('db_query_duration_seconds', {
  description: 'Database query duration in seconds',
  unit: 's',
});

// Counter: Cache hits/misses
export const cacheHitsTotal = meter.createCounter('cache_hits_total', {
  description: 'Total cache hits',
  unit: '1',
});

export const cacheMissesTotal = meter.createCounter('cache_misses_total', {
  description: 'Total cache misses',
  unit: '1',
});

// Gauge: Active users
export const activeUsers = meter.createUpDownCounter('active_users', {
  description: 'Number of active users',
  unit: '1',
});

// Counter: Pressure tests executed
export const pressureTestsTotal = meter.createCounter('pressure_tests_total', {
  description: 'Total pressure tests executed',
  unit: '1',
});

// Histogram: Pressure test duration
export const pressureTestDuration = meter.createHistogram('pressure_test_duration_seconds', {
  description: 'Pressure test execution duration',
  unit: 's',
});

// Counter: Export operations
export const exportsTotal = meter.createCounter('exports_total', {
  description: 'Total number of export operations (PDF, PNG, SVG)',
  unit: '1',
});

// Histogram: Export operation duration
export const exportDuration = meter.createHistogram('export_duration_seconds', {
  description: 'Export operation duration',
  unit: 's',
});

// Counter: Authentication events
export const authEventsTotal = meter.createCounter('auth_events_total', {
  description: 'Total authentication events (login, logout, register)',
  unit: '1',
});

// Counter: API errors
export const apiErrorsTotal = meter.createCounter('api_errors_total', {
  description: 'Total API errors by status code and endpoint',
  unit: '1',
});
