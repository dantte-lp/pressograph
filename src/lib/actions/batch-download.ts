/**
 * Batch Download Actions
 *
 * Server actions for creating ZIP archives of multiple test graphs
 */

'use server';

import JSZip from 'jszip';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { pressureTests, projects } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { generateEmulatedTestData } from '@/lib/utils/pressure-data-generator';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';

/**
 * Result type for batch download
 */
export interface BatchDownloadResult {
  success: boolean;
  zipData?: Uint8Array;
  filename?: string;
  error?: string;
  processedCount?: number;
  totalCount?: number;
}

/**
 * Generate CSV content from test data
 */
function generateCSV(config: PressureTestConfig, testNumber: string, testName: string): string {
  const data = generateEmulatedTestData(config);

  const lines: string[] = [];

  // Header
  lines.push(`Test Number: ${testNumber}`);
  lines.push(`Test Name: ${testName}`);
  lines.push(`Equipment ID: ${config.equipmentId || 'N/A'}`);
  lines.push(`Working Pressure: ${config.workingPressure} ${config.pressureUnit}`);
  lines.push(`Max Pressure: ${config.maxPressure} ${config.pressureUnit}`);
  lines.push(`Test Duration: ${config.testDuration} hours`);
  lines.push('');
  lines.push('Time (s),Pressure (' + config.pressureUnit + ')');

  // Data rows
  for (const point of data.points) {
    lines.push(`${point.time},${point.pressure}`);
  }

  return lines.join('\n');
}

/**
 * Generate JSON content from test data
 */
function generateJSON(config: PressureTestConfig, testNumber: string, testName: string): string {
  const data = generateEmulatedTestData(config);

  const output = {
    metadata: {
      testNumber,
      testName,
      equipmentId: config.equipmentId || 'N/A',
      workingPressure: config.workingPressure,
      maxPressure: config.maxPressure,
      testDuration: config.testDuration,
      pressureUnit: config.pressureUnit,
      temperatureUnit: config.temperatureUnit,
      exportedAt: new Date().toISOString(),
    },
    data: data.points.map(point => ({
      time: point.time,
      pressure: point.pressure,
    })),
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Create ZIP archive with test data for selected tests
 *
 * @param testIds - Array of test IDs to download
 * @param format - Export format: 'csv' or 'json'
 * @returns ZIP file data as Uint8Array
 */
export async function createBatchDownload(
  testIds: string[],
  format: 'csv' | 'json' = 'csv'
): Promise<BatchDownloadResult> {
  try {
    const session = await requireAuth();

    // Validate input
    if (!testIds || testIds.length === 0) {
      return {
        success: false,
        error: 'No tests selected',
      };
    }

    // Validate organization ID
    if (!session.user.organizationId) {
      return {
        success: false,
        error: 'User organization not found',
      };
    }

    // Fetch tests with project names
    const tests = await db
      .select({
        id: pressureTests.id,
        testNumber: pressureTests.testNumber,
        name: pressureTests.name,
        config: pressureTests.config,
        projectName: projects.name,
        organizationId: pressureTests.organizationId,
      })
      .from(pressureTests)
      .leftJoin(projects, eq(pressureTests.projectId, projects.id))
      .where(
        and(
          inArray(pressureTests.id, testIds),
          eq(pressureTests.organizationId, session.user.organizationId)
        )
      );

    // Validate access
    if (tests.length === 0) {
      return {
        success: false,
        error: 'No tests found or access denied',
      };
    }

    // Create ZIP archive
    const zip = new JSZip();
    let processedCount = 0;

    for (const test of tests) {
      try {
        const config = test.config as PressureTestConfig;
        const testName = test.name || 'Unnamed Test';
        const projectName = test.projectName || 'No Project';

        // Generate content based on format
        let content: string;
        let extension: string;

        if (format === 'json') {
          content = generateJSON(config, test.testNumber, testName);
          extension = 'json';
        } else {
          content = generateCSV(config, test.testNumber, testName);
          extension = 'csv';
        }

        // Create folder structure: ProjectName/TestNumber_TestName.ext
        const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
        const sanitizedTestNumber = test.testNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
        const sanitizedTestName = testName.replace(/[^a-zA-Z0-9-_]/g, '_');
        const filename = `${sanitizedProjectName}/${sanitizedTestNumber}_${sanitizedTestName}.${extension}`;

        zip.file(filename, content);
        processedCount++;
      } catch (error) {
        console.error(`Error processing test ${test.testNumber}:`, error);
        // Continue with other tests
      }
    }

    if (processedCount === 0) {
      return {
        success: false,
        error: 'Failed to process any tests',
      };
    }

    // Generate ZIP file
    const zipData = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `pressograph-tests-${timestamp}.zip`;

    return {
      success: true,
      zipData,
      filename,
      processedCount,
      totalCount: tests.length,
    };
  } catch (error) {
    console.error('Error creating batch download:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create ZIP archive',
    };
  }
}

/**
 * Get test count for validation before download
 */
export async function getTestCountForDownload(testIds: string[]): Promise<number> {
  try {
    const session = await requireAuth();

    if (!session.user.organizationId) {
      return 0;
    }

    const tests = await db
      .select({ id: pressureTests.id })
      .from(pressureTests)
      .where(
        and(
          inArray(pressureTests.id, testIds),
          eq(pressureTests.organizationId, session.user.organizationId)
        )
      );

    return tests.length;
  } catch (error) {
    console.error('Error getting test count:', error);
    return 0;
  }
}
