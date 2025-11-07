/**
 * Graph Export Utilities
 *
 * Handles exporting pressure test graphs to various formats (PNG, PDF, CSV, JSON)
 * with support for both real test data and emulated/simulated data.
 *
 * Key features:
 * - Watermarking for emulated data
 * - Multiple export formats
 * - Proper metadata inclusion
 * - TypeScript type safety
 */

import { jsPDF } from 'jspdf';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';
import {
  generateEmulatedTestData,
  emulatedDataToCSV,
  emulatedDataToJSON,
} from './pressure-data-generator';

/**
 * Export options for graph exports
 */
export interface ExportOptions {
  testNumber: string;
  testName: string;
  format: 'png' | 'pdf' | 'csv' | 'json';
  isEmulation: boolean;
  watermark?: string;
  includeMetadata?: boolean;
}

/**
 * Generate filename for export
 *
 * @param options - Export options
 * @returns Formatted filename with extension
 */
export function generateExportFilename(options: ExportOptions): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const prefix = options.isEmulation ? 'EMULATED' : 'TEST';
  const extension = options.format;

  // Sanitize test number for filename
  const sanitizedTestNumber = options.testNumber.replace(/[^a-zA-Z0-9-_]/g, '_');

  return `${prefix}_${sanitizedTestNumber}_${timestamp}.${extension}`;
}

/**
 * Export emulated test data as CSV
 *
 * @param config - Test configuration
 * @param testNumber - Test identification number
 * @param testName - Human-readable test name
 * @returns CSV file content and filename
 */
export async function exportEmulatedCSV(
  config: PressureTestConfig,
  testNumber: string,
  testName: string
): Promise<{ content: string; filename: string; mimeType: string }> {
  const emulatedData = generateEmulatedTestData(config);
  const csvContent = emulatedDataToCSV(emulatedData);

  const filename = generateExportFilename({
    testNumber,
    testName,
    format: 'csv',
    isEmulation: true,
  });

  return {
    content: csvContent,
    filename,
    mimeType: 'text/csv',
  };
}

/**
 * Export emulated test data as JSON
 *
 * @param config - Test configuration
 * @param testNumber - Test identification number
 * @param testName - Human-readable test name
 * @returns JSON file content and filename
 */
export async function exportEmulatedJSON(
  config: PressureTestConfig,
  testNumber: string,
  testName: string
): Promise<{ content: string; filename: string; mimeType: string }> {
  const emulatedData = generateEmulatedTestData(config);
  const jsonContent = emulatedDataToJSON(emulatedData);

  const filename = generateExportFilename({
    testNumber,
    testName,
    format: 'json',
    isEmulation: true,
  });

  return {
    content: jsonContent,
    filename,
    mimeType: 'application/json',
  };
}


/**
 * Download a file to the user's device
 *
 * @param content - File content (string or Blob)
 * @param filename - Name of file to save
 * @param mimeType - MIME type of the content
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export graph canvas to PNG
 *
 * This function is meant to be called client-side with a rendered canvas element.
 * For emulated exports, the canvas should be pre-rendered with emulated data.
 *
 * @param canvas - Rendered canvas element
 * @param testNumber - Test identification number
 * @param testName - Human-readable test name
 * @param isEmulation - Whether this is emulated data
 */
export async function exportGraphAsPNG(
  canvas: HTMLCanvasElement,
  testNumber: string,
  testName: string,
  isEmulation: boolean
): Promise<void> {
  const filename = generateExportFilename({
    testNumber,
    testName,
    format: 'png',
    isEmulation,
  });

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create PNG blob'));
          return;
        }
        downloadFile(blob, filename, 'image/png');
        resolve();
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Export graph canvas to PDF
 *
 * This function is meant to be called client-side with a rendered canvas element.
 * For emulated exports, the canvas should be pre-rendered with emulated data.
 *
 * @param canvas - Rendered canvas element
 * @param testNumber - Test identification number
 * @param testName - Human-readable test name
 * @param isEmulation - Whether this is emulated data
 * @param config - Test configuration for metadata
 */
export async function exportGraphAsPDF(
  canvas: HTMLCanvasElement,
  testNumber: string,
  testName: string,
  isEmulation: boolean,
  config: PressureTestConfig
): Promise<void> {
  const filename = generateExportFilename({
    testNumber,
    testName,
    format: 'pdf',
    isEmulation,
  });

  // Create PDF in landscape A4 format
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // A4 landscape dimensions: 297mm x 210mm
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 10;

  // Add watermark for emulated data
  if (isEmulation) {
    pdf.setFontSize(60);
    pdf.setTextColor(200, 200, 200);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EMULATED DATA', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });
  }

  // Add graph image
  const imgData = canvas.toDataURL('image/png', 1.0);
  const imgWidth = pageWidth - 2 * margin;
  const imgHeight = (canvas.height / canvas.width) * imgWidth;

  pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, pageHeight - 2 * margin));

  // Add metadata footer
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');

  const footerY = pageHeight - 5;
  pdf.text(`Test: ${testNumber} - ${testName}`, margin, footerY);
  pdf.text(
    `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  pdf.text(
    isEmulation ? 'SIMULATED DATA' : 'Pressograph 2.0',
    pageWidth - margin,
    footerY,
    { align: 'right' }
  );

  // Add second page with test details
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Test Configuration', margin, margin + 10);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  let y = margin + 20;

  const details = [
    ['Test Number:', testNumber],
    ['Test Name:', testName],
    ['Working Pressure:', `${config.workingPressure} ${config.pressureUnit}`],
    ['Max Pressure:', `${config.maxPressure} ${config.pressureUnit}`],
    ['Test Duration:', `${config.testDuration} hours`],
    ['Temperature:', `${config.temperature}°${config.temperatureUnit}`],
    ['Allowable Pressure Drop:', `${config.allowablePressureDrop} ${config.pressureUnit}`],
  ];

  if (config.notes) {
    details.push(['Notes:', config.notes]);
  }

  if (isEmulation) {
    details.push(['DATA TYPE:', '⚠️  EMULATED/SIMULATED - NOT FROM ACTUAL TEST RUN']);
  }

  for (const [label, value] of details) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value.toString(), margin + 60, y);
    y += 7;
  }

  // Add intermediate stages if present
  if (config.intermediateStages && config.intermediateStages.length > 0) {
    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Intermediate Stages:', margin, y);
    y += 7;

    pdf.setFont('helvetica', 'normal');
    for (let i = 0; i < config.intermediateStages.length; i++) {
      const stage = config.intermediateStages[i];
      pdf.text(
        `${i + 1}. Time: ${stage.time} min, Pressure: ${stage.pressure} ${config.pressureUnit}, Duration: ${stage.duration} min`,
        margin + 5,
        y
      );
      y += 6;
    }
  }

  // Save PDF
  pdf.save(filename);
}

/**
 * Metadata for export operations
 */
export interface ExportMetadata {
  format: string;
  fileSize: number;
  generatedAt: Date;
  isEmulation: boolean;
  testNumber: string;
  testName: string;
}

/**
 * Create export metadata object
 *
 * @param content - Export file content
 * @param options - Export options
 * @returns Metadata object
 */
export function createExportMetadata(
  content: string | Blob,
  options: ExportOptions
): ExportMetadata {
  const fileSize = content instanceof Blob ? content.size : new Blob([content]).size;

  return {
    format: options.format.toUpperCase(),
    fileSize,
    generatedAt: new Date(),
    isEmulation: options.isEmulation,
    testNumber: options.testNumber,
    testName: options.testName,
  };
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.23 MB")
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
