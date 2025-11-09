/**
 * Test Number Utilities
 *
 * Helper functions for generating and validating test numbers
 */

import { db } from '@/lib/db';
import { pressureTests } from '@/lib/db/schema/pressure-tests';
import { projects } from '@/lib/db/schema/projects';
import { eq, and } from 'drizzle-orm';

/**
 * Generate a unique test number based on project settings
 *
 * @param projectId - ID of the project
 * @returns Generated test number (e.g., "PT-2025-001" or "PT-ABC123")
 */
export async function generateTestNumber(projectId: string): Promise<string> {
  try {
    // Get project settings
    const project = await db
      .select({ settings: projects.settings })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project[0]) {
      throw new Error('Project not found');
    }

    const projectSettings = project[0].settings as any;
    const prefix = projectSettings?.testNumberPrefix || 'PT';

    // Generate timestamp-based suffix (base36 for compactness)
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);

    return `${prefix}-${timestamp}`;
  } catch (error) {
    console.error('Error generating test number:', error);
    // Fallback to basic format
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    return `PT-${timestamp}`;
  }
}

/**
 * Generate a default test number with current year and sequential number
 *
 * @param projectId - ID of the project
 * @param organizationId - ID of the organization
 * @returns Generated test number (e.g., "PT-2025-001")
 */
export async function generateSequentialTestNumber(
  projectId: string,
  organizationId: string
): Promise<string> {
  try {
    // Get project settings
    const project = await db
      .select({ settings: projects.settings })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const projectSettings = project[0]?.settings as any;
    const prefix = projectSettings?.testNumberPrefix || 'PT';
    const currentYear = new Date().getFullYear();

    // Count existing tests in the organization for this year
    // TODO: Future enhancement - filter by year using date range
    // const yearStart = new Date(currentYear, 0, 1);
    // const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    const existingTests = await db
      .select({ testNumber: pressureTests.testNumber })
      .from(pressureTests)
      .where(
        and(
          eq(pressureTests.organizationId, organizationId),
          // Filter by creation date within current year (optional - can be removed if not needed)
        )
      );

    // Extract numbers from existing test numbers matching the pattern
    const regex = new RegExp(`^${prefix}-(\\d{4})-(\\d+)$`);
    const existingNumbers = existingTests
      .map(t => {
        const match = t.testNumber.match(regex);
        return match ? parseInt(match[2], 10) : 0;
      })
      .filter(n => n > 0);

    // Get next sequential number
    const nextNumber = existingNumbers.length > 0
      ? Math.max(...existingNumbers) + 1
      : 1;

    // Format with leading zeros (3 digits)
    const formattedNumber = nextNumber.toString().padStart(3, '0');

    return `${prefix}-${currentYear}-${formattedNumber}`;
  } catch (error) {
    console.error('Error generating sequential test number:', error);
    // Fallback to timestamp-based
    return generateTestNumber(projectId);
  }
}

/**
 * Validate test number format
 *
 * @param testNumber - Test number to validate
 * @returns True if format is valid
 */
export function isValidTestNumberFormat(testNumber: string): boolean {
  // Allow alphanumeric characters, hyphens, and underscores
  // Length between 3 and 100 characters
  const regex = /^[A-Z0-9][A-Z0-9\-_]{2,99}$/i;
  return regex.test(testNumber);
}

/**
 * Check if test number is unique within organization
 *
 * @param testNumber - Test number to check
 * @param organizationId - Organization ID
 * @param excludeTestId - Optional test ID to exclude (for updates)
 * @returns True if test number is unique
 */
export async function isTestNumberUnique(
  testNumber: string,
  organizationId: string,
  excludeTestId?: string
): Promise<boolean> {
  try {
    const conditions = [
      eq(pressureTests.testNumber, testNumber),
      eq(pressureTests.organizationId, organizationId),
    ];

    // Exclude current test when editing
    if (excludeTestId) {
      // We need to use a raw SQL condition here since drizzle doesn't have a NOT EQUAL operator directly
      const existing = await db
        .select({ id: pressureTests.id })
        .from(pressureTests)
        .where(and(...conditions))
        .limit(1);

      // If found and it's not the excluded test, then it's not unique
      return existing.length === 0 || existing[0].id === excludeTestId;
    }

    const existing = await db
      .select({ id: pressureTests.id })
      .from(pressureTests)
      .where(and(...conditions))
      .limit(1);

    return existing.length === 0;
  } catch (error) {
    console.error('Error checking test number uniqueness:', error);
    return false;
  }
}

/**
 * Validate custom test number
 *
 * @param testNumber - Test number to validate
 * @param organizationId - Organization ID
 * @param excludeTestId - Optional test ID to exclude (for updates)
 * @returns Validation result with error message if invalid
 */
export async function validateCustomTestNumber(
  testNumber: string,
  organizationId: string,
  excludeTestId?: string
): Promise<{ valid: boolean; error?: string }> {
  // Check format
  if (!testNumber || testNumber.trim().length === 0) {
    return { valid: false, error: 'Test number is required' };
  }

  const trimmed = testNumber.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Test number must be at least 3 characters' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Test number must not exceed 100 characters' };
  }

  if (!isValidTestNumberFormat(trimmed)) {
    return {
      valid: false,
      error: 'Test number can only contain letters, numbers, hyphens, and underscores',
    };
  }

  // Check uniqueness
  const isUnique = await isTestNumberUnique(trimmed, organizationId, excludeTestId);

  if (!isUnique) {
    return {
      valid: false,
      error: 'This test number is already in use. Please choose a different number.',
    };
  }

  return { valid: true };
}
