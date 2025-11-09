/**
 * ECharts-Based Graph Export Utilities
 *
 * Uses ECharts native export capabilities to ensure 100% visual parity
 * between preview and export. Supports PNG, PDF, CSV, and JSON formats.
 *
 * Key improvements over v1:
 * - Uses ECharts getDataURL() for consistent rendering
 * - Supports high-resolution exports (pixelRatio: 4)
 * - Russian labels matching v1 behavior
 * - No watermarks on exports (clean professional output)
 */

import { jsPDF } from 'jspdf';
import { echarts, type PressureChartOption } from '@/lib/echarts-config';
import type { ECharts } from 'echarts/core';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';
import {
  generateEmulatedTestData,
  emulatedDataToCSV,
  emulatedDataToJSON,
} from './pressure-data-generator';

// Use centralized ECharts configuration
type ECOption = PressureChartOption;

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
 * Create ECharts instance with Russian-style configuration for export
 * Matches v1 Pressograph styling exactly
 */
function createExportChart(
  config: PressureTestConfig,
  testNumber: string,
  testName: string
): { chart: ECharts; canvas: HTMLDivElement } {
  // Generate emulated data
  const emulatedData = generateEmulatedTestData(config);

  // Create temporary container
  const container = document.createElement('div');
  container.style.width = '1123px';
  container.style.height = '794px';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  // Initialize chart
  const chart = echarts.init(container, undefined, {
    renderer: 'canvas',
    devicePixelRatio: 4, // High resolution for export
  });

  // Convert emulated data to chart data format
  const chartData: [number, number][] = emulatedData.points.map(point => [
    point.time.getTime(),
    point.pressure,
  ]);

  // Calculate time range with buffer (matching v1: 5% buffer)
  const timeRange = emulatedData.endDateTime.getTime() - emulatedData.startDateTime.getTime();
  const timeBuffer = timeRange * 0.05;
  const graphStartTime = emulatedData.startDateTime.getTime() - timeBuffer;
  const graphEndTime = emulatedData.endDateTime.getTime() + timeBuffer;

  // Pressure scaling (matching v1)
  const pressureMaxRaw = config.maxPressure * 1.1;
  const pressureMax = Math.ceil(pressureMaxRaw / 5) * 5;

  // Configure chart with Russian labels (matching v1)
  const option: ECOption = {
    title: {
      text: testName || 'Испытание давления',
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Arial',
      },
    },
    grid: {
      left: 80,
      right: 50,
      top: 80,
      bottom: 120,
      containLabel: false,
    },
    xAxis: {
      type: 'time',
      name: 'Время',
      nameLocation: 'middle',
      nameGap: 45,
      nameTextStyle: {
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Arial',
      },
      min: graphStartTime,
      max: graphEndTime,
      axisLabel: {
        fontSize: 11,
        fontFamily: 'Arial',
        formatter: (value: number) => {
          const date = new Date(value);
          const timeStr = date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          const dateStr = date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          return `${timeStr}\n${dateStr}`;
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#d0d0d0',
          width: 1,
        },
      },
      minorSplitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0',
          width: 0.5,
        },
      },
      axisLine: {
        lineStyle: {
          color: '#000',
          width: 2,
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Давление, МПа',
      nameLocation: 'middle',
      nameGap: 50,
      nameRotate: 90,
      nameTextStyle: {
        fontSize: 14,
        fontFamily: 'Arial',
      },
      min: 0,
      max: pressureMax,
      interval: 5,
      axisLabel: {
        fontSize: 12,
        fontFamily: 'Arial',
        formatter: '{value}',
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0',
          width: 1,
        },
      },
      axisLine: {
        lineStyle: {
          color: '#000',
          width: 2,
        },
      },
    },
    series: [
      {
        type: 'line',
        data: chartData,
        smooth: false,
        showSymbol: false,
        lineStyle: {
          color: '#0066cc',
          width: 2,
        },
        areaStyle: {
          color: 'rgba(173, 216, 230, 0.3)',
        },
      },
    ],
    graphic: [
      // Footer information (Russian, matching v1)
      {
        type: 'text',
        left: 'center',
        bottom: 45,
        style: {
          text: `Испытание №${testNumber}`,
          fontSize: 11,
          fontFamily: 'Arial',
          fill: '#000',
        },
      },
      {
        type: 'text',
        left: 'center',
        bottom: 33,
        style: {
          text: `Дата: ${emulatedData.startDateTime.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}`,
          fontSize: 11,
          fontFamily: 'Arial',
          fill: '#000',
        },
      },
      {
        type: 'text',
        left: 'center',
        bottom: 21,
        style: {
          text: `Рабочее давление: ${config.workingPressure} МПа | Температура: ${config.temperature}°C`,
          fontSize: 11,
          fontFamily: 'Arial',
          fill: '#000',
        },
      },
    ],
  };

  chart.setOption(option);

  return { chart, canvas: container };
}

/**
 * Export graph as PNG using ECharts native export
 *
 * Uses ECharts' getDataURL() method for consistent rendering.
 * Ensures 100% visual parity with preview.
 */
export async function exportGraphAsPNG(
  _canvas: HTMLCanvasElement | null,
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

  // Create temporary ECharts instance for export
  const { chart, canvas } = createExportChart(config, testNumber, testName);

  try {
    // Export using ECharts getDataURL (high resolution)
    const dataURL = chart.getDataURL({
      type: 'png',
      pixelRatio: 4,
      backgroundColor: '#fff',
    });

    // Convert data URL to blob and download
    const response = await fetch(dataURL);
    const blob = await response.blob();
    downloadFile(blob, filename, 'image/png');
  } finally {
    // Cleanup
    chart.dispose();
    document.body.removeChild(canvas);
  }
}

/**
 * Export graph as PDF using ECharts native export
 *
 * Creates a high-quality PDF with only the graph (no metadata page).
 * User requirement: "при экспорте должен быть только график"
 */
export async function exportGraphAsPDF(
  _canvas: HTMLCanvasElement | null,
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

  // Create temporary ECharts instance for export
  const { chart, canvas } = createExportChart(config, testNumber, testName);

  try {
    // Export using ECharts getDataURL (high resolution)
    const dataURL = chart.getDataURL({
      type: 'png',
      pixelRatio: 4,
      backgroundColor: '#fff',
    });

    // Create PDF in landscape A4 format (matching v1)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // A4 landscape dimensions: 297mm x 210mm
    // Add image to fill the entire page (no margins, matching v1)
    pdf.addImage(dataURL, 'PNG', 0, 0, 297, 210);

    // Save PDF (ONLY the graph, no second page with metadata)
    pdf.save(filename);
  } finally {
    // Cleanup
    chart.dispose();
    document.body.removeChild(canvas);
  }
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
