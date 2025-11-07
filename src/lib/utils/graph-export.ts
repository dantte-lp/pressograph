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
 * Render graph to a fresh canvas for export (without watermark)
 * This ensures clean export matching v1 behavior
 *
 * @param config - Test configuration
 * @param testNumber - Test identification number
 * @param testName - Human-readable test name
 * @returns Rendered canvas element with high resolution
 */
function renderGraphForExport(
  config: PressureTestConfig,
  testNumber: string,
  testName: string
): HTMLCanvasElement {
  // Create temporary canvas for export
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Generate emulated data
  const emulatedData = generateEmulatedTestData(config);

  // High resolution for export (matching v1: 1123x794 at scale 4)
  const scale = 4;
  const displayWidth = 1123;
  const displayHeight = 794;
  canvas.width = displayWidth * scale;
  canvas.height = displayHeight * scale;
  ctx.scale(scale, scale);

  // Background (white)
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  // Graph margins
  const margin = { top: 80, right: 50, bottom: 120, left: 80 };
  const graphWidth = displayWidth - margin.left - margin.right;
  const graphHeight = displayHeight - margin.top - margin.bottom;

  // Time buffer (5% on each side)
  const timeRange = emulatedData.endDateTime.getTime() - emulatedData.startDateTime.getTime();
  const timeBuffer = timeRange * 0.05;
  const graphStartTime = new Date(emulatedData.startDateTime.getTime() - timeBuffer);
  const graphEndTime = new Date(emulatedData.endDateTime.getTime() + timeBuffer);
  const graphTimeRange = graphEndTime.getTime() - graphStartTime.getTime();

  // Pressure scaling
  const pressureMaxRaw = config.maxPressure * 1.1;
  const pressureMax = Math.ceil(pressureMaxRaw / 5) * 5;

  const xScale = (time: number) => {
    return margin.left + ((time - graphStartTime.getTime()) / graphTimeRange) * graphWidth;
  };

  const yScale = (pressure: number) => {
    return margin.top + graphHeight - (pressure / pressureMax) * graphHeight;
  };

  // Title (Russian format matching v1)
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.fillText(testName || 'Испытание давления', displayWidth / 2, 40);

  // Draw axes
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + graphHeight);
  ctx.lineTo(margin.left + graphWidth, margin.top + graphHeight);
  ctx.stroke();

  // Grid lines (Y-axis) - light gray
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  const gridStep = 5;
  const numSteps = Math.ceil(pressureMax / gridStep);

  for (let i = 0; i <= numSteps; i++) {
    const pressure = i * gridStep;
    if (pressure <= pressureMax) {
      const y = yScale(pressure);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + graphWidth, y);
      ctx.stroke();
    }
  }

  // Y-axis labels
  ctx.font = '12px Arial';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'right';

  for (let i = 0; i <= numSteps; i++) {
    const pressure = i * gridStep;
    if (pressure <= pressureMax) {
      const y = yScale(pressure);
      ctx.fillText(pressure.toFixed(0), margin.left - 10, y + 5);
    }
  }

  // Y-axis label (Russian)
  ctx.save();
  ctx.translate(20, displayHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = '14px Arial';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.fillText('Давление, МПа', 0, 0);
  ctx.restore();

  // Grid lines (X-axis) - darker gray
  const testDuration = config.testDuration;
  const timeInterval = testDuration <= 30 ? 2 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000;

  const gridStartTime = new Date(graphStartTime);
  gridStartTime.setMinutes(0, 0, 0);
  const intervalHours = timeInterval / (60 * 60 * 1000);
  gridStartTime.setHours(Math.floor(gridStartTime.getHours() / intervalHours) * intervalHours);

  if (gridStartTime > graphStartTime) {
    gridStartTime.setHours(gridStartTime.getHours() - intervalHours);
  }

  ctx.font = '11px Arial';
  ctx.textAlign = 'center';

  // Helper function to format date/time (matching v1)
  const formatDateTime = (date: Date): string => {
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return `${timeStr} ${dateStr}`;
  };

  for (
    let time = gridStartTime.getTime();
    time <= graphEndTime.getTime() + timeInterval;
    time += timeInterval
  ) {
    const x = xScale(time);
    if (x >= margin.left && x <= margin.left + graphWidth) {
      ctx.strokeStyle = '#d0d0d0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + graphHeight);
      ctx.stroke();

      const date = new Date(time);
      const timeStr = formatDateTime(date).split(' ');
      ctx.fillStyle = 'black';
      ctx.fillText(timeStr[0], x, margin.top + graphHeight + 20);
      ctx.fillText(timeStr[1], x, margin.top + graphHeight + 35);
    }
  }

  // Fine grid lines (30 minutes)
  const thirtyMinutes = 30 * 60 * 1000;
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 0.5;
  for (
    let time = graphStartTime.getTime();
    time <= graphEndTime.getTime();
    time += thirtyMinutes
  ) {
    const x = xScale(time);
    if (x >= margin.left && x <= margin.left + graphWidth) {
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + graphHeight);
      ctx.stroke();
    }
  }

  // Tick marks on time axis
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  const oneHour = 60 * 60 * 1000;
  for (let time = gridStartTime.getTime(); time <= graphEndTime.getTime(); time += oneHour) {
    const x = xScale(time);
    if (x >= margin.left && x <= margin.left + graphWidth) {
      ctx.beginPath();
      ctx.moveTo(x, margin.top + graphHeight);
      ctx.lineTo(x, margin.top + graphHeight + 8);
      ctx.stroke();
    }
  }

  const tenMinutes = 10 * 60 * 1000;
  ctx.lineWidth = 0.5;
  for (let time = graphStartTime.getTime(); time <= graphEndTime.getTime(); time += tenMinutes) {
    const x = xScale(time);
    if (x >= margin.left && x <= margin.left + graphWidth) {
      const date = new Date(time);
      if (date.getMinutes() !== 0) {
        ctx.beginPath();
        ctx.moveTo(x, margin.top + graphHeight);
        ctx.lineTo(x, margin.top + graphHeight + 4);
        ctx.stroke();
      }
    }
  }

  // X-axis label (Russian)
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.fillText('Время', displayWidth / 2, displayHeight - 60);

  // Draw pressure line with area fill
  if (emulatedData.points.length > 0) {
    // Fill area under curve
    ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
    ctx.beginPath();
    ctx.moveTo(xScale(emulatedData.points[0].time.getTime()), yScale(0));
    for (const point of emulatedData.points) {
      ctx.lineTo(xScale(point.time.getTime()), yScale(point.pressure));
    }
    ctx.lineTo(xScale(emulatedData.points[emulatedData.points.length - 1].time.getTime()), yScale(0));
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xScale(emulatedData.points[0].time.getTime()), yScale(emulatedData.points[0].pressure));
    for (const point of emulatedData.points) {
      ctx.lineTo(xScale(point.time.getTime()), yScale(point.pressure));
    }
    ctx.stroke();
  }

  // Footer information (Russian, matching v1)
  ctx.fillStyle = 'black';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  const baseY = displayHeight - 45;
  ctx.fillText(`Испытание №${testNumber}`, displayWidth / 2, baseY);

  // Format date from emulatedData
  const dateStr = emulatedData.startDateTime.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  ctx.fillText(`Дата: ${dateStr}`, displayWidth / 2, baseY + 12);
  ctx.fillText(
    `Рабочее давление: ${config.workingPressure} МПа | Температура: ${config.temperature}°C`,
    displayWidth / 2,
    baseY + 24
  );

  return canvas;
}

/**
 * Export graph canvas to PNG
 *
 * Creates a fresh high-resolution canvas for export (no watermark, no preview artifacts).
 * Matches v1 export behavior.
 *
 * @param _canvas - Canvas reference (unused, kept for API compatibility)
 * @param testNumber - Test identification number
 * @param testName - Human-readable test name
 * @param isEmulation - Whether this is emulated data
 * @param config - Test configuration
 */
export async function exportGraphAsPNG(
  _canvas: HTMLCanvasElement,
  testNumber: string,
  testName: string,
  isEmulation: boolean,
  config?: PressureTestConfig
): Promise<void> {
  if (!config) {
    throw new Error('Test configuration is required for export');
  }

  const filename = generateExportFilename({
    testNumber,
    testName,
    format: 'png',
    isEmulation,
  });

  // Render fresh canvas for export (matching v1 approach)
  const exportCanvas = renderGraphForExport(config, testNumber, testName);

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    exportCanvas.toBlob(
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
 * Creates a fresh high-resolution canvas for export and embeds ONLY the graph image.
 * No watermark, no metadata page - just the clean graph matching v1 behavior.
 * User requirement: "при экспорте должен быть только график, без каких-либо текстовых данных"
 *
 * @param _canvas - Canvas reference (unused, kept for API compatibility)
 * @param testNumber - Test identification number
 * @param testName - Human-readable test name
 * @param isEmulation - Whether this is emulated data
 * @param config - Test configuration for rendering
 */
export async function exportGraphAsPDF(
  _canvas: HTMLCanvasElement,
  testNumber: string,
  testName: string,
  isEmulation: boolean,
  config?: PressureTestConfig
): Promise<void> {
  if (!config) {
    throw new Error('Test configuration is required for export');
  }

  const filename = generateExportFilename({
    testNumber,
    testName,
    format: 'pdf',
    isEmulation,
  });

  // Render fresh canvas for export (matching v1 approach)
  const exportCanvas = renderGraphForExport(config, testNumber, testName);

  // Convert canvas to data URL
  const imgData = exportCanvas.toDataURL('image/png', 1.0);

  // Create PDF in landscape A4 format (matching v1)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // A4 landscape dimensions: 297mm x 210mm
  // Add image to fill the entire page (no margins, matching v1)
  pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);

  // Save PDF (ONLY the graph, no second page with metadata)
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
