// ═══════════════════════════════════════════════════════════════════
// API Service - Backend Communication
// ═══════════════════════════════════════════════════════════════════

import type { TestSettings, Theme } from '../types';

/**
 * API configuration
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/v1`;

/**
 * PNG Export Configuration
 */
export interface PNGExportConfig {
  settings: TestSettings;
  theme?: Theme;
  scale?: number; // 1-4, default: 2
  width?: number; // 400-4000, default: 1200
  height?: number; // 300-3000, default: 800
}

/**
 * Export Response Metadata
 */
export interface ExportMetadata {
  filename: string;
  fileSize: number;
  generationTimeMs: number;
}

/**
 * API Error Response
 */
export interface APIError {
  success: false;
  error: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Export PNG via backend API
 *
 * Sends graph settings to backend, which renders the graph
 * server-side using node-canvas and returns a PNG file.
 *
 * @param config - PNG export configuration
 * @returns Promise with blob, filename, and metadata
 * @throws Error if export fails or validation errors occur
 */
export const exportPNG = async (
  config: PNGExportConfig
): Promise<{ blob: Blob; filename: string; metadata: ExportMetadata }> => {
  const response = await fetch(`${API_BASE}/graph/export/png`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add authentication token when auth is integrated
      // 'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    // Try to parse error message
    let errorMessage = 'PNG export failed';
    try {
      const errorData: APIError = await response.json();
      if (errorData.errors && errorData.errors.length > 0) {
        errorMessage = errorData.errors.map(e => `${e.field}: ${e.message}`).join(', ');
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = `PNG export failed: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  // Extract metadata from headers
  const filename = extractFilenameFromHeaders(response.headers);
  const fileSize = parseInt(response.headers.get('X-File-Size') || '0', 10);
  const generationTimeMs = parseInt(response.headers.get('X-Generation-Time-Ms') || '0', 10);

  // Get blob
  const blob = await response.blob();

  return {
    blob,
    filename,
    metadata: {
      filename,
      fileSize,
      generationTimeMs,
    },
  };
};

/**
 * Extract filename from Content-Disposition header
 *
 * @param headers - Response headers
 * @returns Extracted filename or fallback
 */
const extractFilenameFromHeaders = (headers: Headers): string => {
  const disposition = headers.get('Content-Disposition');
  if (!disposition) {
    return `pressure_test_${Date.now()}.png`;
  }

  // Parse: attachment; filename="graph-123-1234567890.png"
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
  if (filenameMatch && filenameMatch[1]) {
    return filenameMatch[1];
  }

  return `pressure_test_${Date.now()}.png`;
};

/**
 * Validate test settings via backend
 *
 * @param settings - Test settings to validate
 * @returns Validation result
 */
export const validateSettings = async (
  settings: TestSettings
): Promise<{ valid: boolean; errors?: Array<{ field: string; message: string }> }> => {
  const response = await fetch(`${API_BASE}/graph/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error('Validation request failed');
  }

  const data = await response.json();
  return {
    valid: data.valid,
    errors: data.errors,
  };
};

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Format generation time for display
 *
 * @param ms - Time in milliseconds
 * @returns Formatted string (e.g., "1.23s")
 */
export const formatGenerationTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};
