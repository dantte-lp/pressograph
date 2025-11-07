/**
 * Test Configuration Import/Export Utilities
 *
 * Handles JSON export and import of pressure test configurations
 * for backup, sharing, and template purposes.
 *
 * Features:
 * - Zod validation for imported data
 * - Type-safe configuration handling
 * - User-friendly error messages
 * - Timestamp-based file naming
 */

import { z } from 'zod';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';

/**
 * Zod schema for validating imported test configurations
 */
export const TestConfigImportSchema = z.object({
  // Core parameters (required)
  workingPressure: z.number().positive('Working pressure must be positive'),
  maxPressure: z.number().positive('Max pressure must be positive'),
  testDuration: z.number().positive('Test duration must be positive'),
  temperature: z.number(),
  allowablePressureDrop: z.number().nonnegative('Allowable pressure drop must be non-negative'),

  // Test schedule (optional)
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),

  // Intermediate stages (optional)
  intermediateStages: z.array(
    z.object({
      time: z.number().nonnegative('Stage time must be non-negative'),
      pressure: z.number().positive('Stage pressure must be positive'),
      duration: z.number().positive('Stage duration must be positive'),
    })
  ).default([]),

  // Units (optional with defaults)
  pressureUnit: z.enum(['MPa', 'Bar', 'PSI']).default('MPa'),
  temperatureUnit: z.enum(['C', 'F']).default('C'),

  // Additional metadata (optional)
  notes: z.string().optional(),
  equipmentId: z.string().optional(),
  operatorName: z.string().optional(),

  // Additional fields that might be in exported data but not in config
  testNumber: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
}).refine(
  (data) => data.maxPressure >= data.workingPressure,
  {
    message: 'Max pressure must be greater than or equal to working pressure',
    path: ['maxPressure'],
  }
);

export type TestConfigImport = z.infer<typeof TestConfigImportSchema>;

/**
 * Export configuration for test import/export
 */
export interface TestConfigExportOptions {
  config: PressureTestConfig;
  testNumber?: string;
  name?: string;
  description?: string;
  includeMetadata?: boolean;
}

/**
 * Result of import operation
 */
export interface ImportResult {
  success: boolean;
  data?: Partial<PressureTestConfig>;
  error?: string;
  validationErrors?: Array<{ field: string; message: string }>;
}

/**
 * Generate timestamp string for filenames
 */
function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
}

/**
 * Download a file with given content and filename
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export test configuration to JSON file
 *
 * @param options - Export options including config and metadata
 * @example
 * ```typescript
 * exportTestConfig({
 *   config: testConfig,
 *   testNumber: 'PT-2025-001',
 *   name: 'Daily Test',
 *   includeMetadata: true
 * });
 * ```
 */
export function exportTestConfig(options: TestConfigExportOptions): void {
  const { config, testNumber, name, description, includeMetadata = true } = options;

  // Build export data
  const exportData: Record<string, any> = {
    // Core configuration
    ...config,
  };

  // Add metadata if requested
  if (includeMetadata) {
    if (testNumber) exportData.testNumber = testNumber;
    if (name) exportData.name = name;
    if (description) exportData.description = description;

    // Add export metadata
    exportData._exportMetadata = {
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
      source: 'Pressograph 2.0',
    };
  }

  // Convert to pretty-printed JSON
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Generate filename
  const testNumberPart = testNumber ? `${testNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}_` : '';
  const filename = `pressure_test_${testNumberPart}${getTimestamp()}.json`;

  // Download file
  downloadFile(blob, filename);
}

/**
 * Import test configuration from JSON file
 *
 * @param file - The JSON file to import
 * @param onSuccess - Callback for successful import
 * @param onError - Callback for failed import
 *
 * @example
 * ```typescript
 * importTestConfig(
 *   file,
 *   (result) => {
 *     if (result.success && result.data) {
 *       setFormValues(result.data);
 *       toast.success('Configuration imported successfully');
 *     }
 *   },
 *   (error) => {
 *     toast.error(error);
 *   }
 * );
 * ```
 */
export function importTestConfig(
  file: File,
  onSuccess: (result: ImportResult) => void,
  onError: (error: string) => void
): void {
  // Validate file type
  if (!file.name.endsWith('.json')) {
    onError('Invalid file type. Please select a JSON file.');
    return;
  }

  // Validate file size (max 1MB for safety)
  const maxSize = 1024 * 1024; // 1MB
  if (file.size > maxSize) {
    onError('File is too large. Maximum size is 1MB.');
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const result = e.target?.result;
      if (typeof result !== 'string') {
        throw new Error('Invalid file format');
      }

      // Parse JSON
      const parsed = JSON.parse(result);

      // Validate with Zod schema
      const validated = TestConfigImportSchema.parse(parsed);

      // Remove export metadata if present
      const { testNumber, name, description, ...configData } = validated;

      // Return success with parsed data
      onSuccess({
        success: true,
        data: configData as Partial<PressureTestConfig>,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod validation errors
        const validationErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const errorMessage = `Validation failed:\n${validationErrors
          .map((e) => `- ${e.field}: ${e.message}`)
          .join('\n')}`;

        onError(errorMessage);
        onSuccess({
          success: false,
          error: errorMessage,
          validationErrors,
        });
      } else if (error instanceof SyntaxError) {
        const errorMessage = 'Invalid JSON format. Please check the file.';
        onError(errorMessage);
        onSuccess({
          success: false,
          error: errorMessage,
        });
      } else {
        const errorMessage = `Failed to import: ${(error as Error).message}`;
        onError(errorMessage);
        onSuccess({
          success: false,
          error: errorMessage,
        });
      }
    }
  };

  reader.onerror = () => {
    const errorMessage = 'Failed to read file. Please try again.';
    onError(errorMessage);
    onSuccess({
      success: false,
      error: errorMessage,
    });
  };

  reader.readAsText(file);
}

/**
 * Validate a test configuration without importing
 *
 * @param configData - The configuration data to validate
 * @returns Validation result with errors if any
 */
export function validateTestConfig(configData: unknown): ImportResult {
  try {
    const validated = TestConfigImportSchema.parse(configData);
    const { testNumber, name, description, ...config } = validated;

    return {
      success: true,
      data: config as Partial<PressureTestConfig>,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        error: 'Validation failed',
        validationErrors,
      };
    }

    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
