'use client';

/**
 * ECharts Export Dialog Component
 *
 * Exports pressure test graphs using ECharts best practices with dedicated instance.
 * Implements the recommended approach from /docs/ECHARTS_BEST_PRACTICES.md
 *
 * Key Features (Per Best Practices):
 * - Creates dedicated ECharts instance at export resolution (1920x1080)
 * - Sets devicePixelRatio during initialization for crisp rendering
 * - Properly disposes temporary instance to prevent memory leaks
 * - Wide aspect ratio (16:9) for professional presentations
 * - White background for print-ready output
 *
 * Implementation follows "Export/Image Generation" section of best practices:
 * 1. Create hidden container with target dimensions
 * 2. Initialize ECharts instance with export dimensions
 * 3. Clone chart options from preview
 * 4. Render at full resolution (no scaling)
 * 5. Export using getDataURL
 * 6. Dispose instance properly
 *
 * @see /docs/ECHARTS_BEST_PRACTICES.md - Export/Image Generation section
 */

import { useState } from 'react';
import { Download, FileImage, Settings2, ChevronDown } from 'lucide-react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
  ToolboxComponent,
  GraphicComponent,
} from 'echarts/components';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
import type { ECharts, ComposeOption } from 'echarts/core';
import type { LineSeriesOption } from 'echarts/charts';
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption,
  DataZoomComponentOption,
  ToolboxComponentOption,
} from 'echarts/components';
import {
  Dialog,
  DialogContentFullscreen,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';
import { PressureTestPreview } from './pressure-test-preview';
import { applyCanvasStyle } from '@/lib/utils/echarts-canvas-style';
import {
  generateRealisticTestData,
  convertToMinutes,
} from '@/lib/utils/pressure-drift-simulator';
import { sanitizeForSVG, cleanSVGForExport } from '@/lib/utils/svg-sanitization';

// Register ECharts components for export (tree-shaking optimization)
// Include both Canvas and SVG renderers for export flexibility
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
  ToolboxComponent,
  GraphicComponent,
  CanvasRenderer,
  SVGRenderer,
]);

// Type-safe chart option composition
type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | DataZoomComponentOption
  | ToolboxComponentOption
>;

/**
 * Intermediate pressure stage structure
 */
interface IntermediateStage {
  time: number; // minutes
  pressure: number;
  duration: number; // minutes
}

/**
 * Export format options
 */
const EXPORT_FORMATS = {
  PNG: 'png',
  SVG: 'svg',
  PDF: 'pdf',
} as const;

type ExportFormat = keyof typeof EXPORT_FORMATS;

/**
 * Export quality presets with correct resolution standards
 * @see https://en.wikipedia.org/wiki/Display_resolution
 */
const EXPORT_QUALITY_PRESETS = {
  'HD+': {
    width: 1600,
    height: 900,
    pixelRatio: 2,
    label: 'HD+ (1600×900)',
    description: 'HD Plus - Good for web display',
  },
  FHD: {
    width: 1920,
    height: 1080,
    pixelRatio: 2,
    label: 'Full HD (1920×1080)',
    description: 'Full HD 1080p - Standard quality',
  },
  QHD: {
    width: 2560,
    height: 1440,
    pixelRatio: 2,
    label: 'Quad HD (2560×1440)',
    description: 'QHD 1440p - High quality',
  },
  '4K': {
    width: 3840,
    height: 2160,
    pixelRatio: 2,
    label: '4K UHD (3840×2160)',
    description: '4K Ultra HD 2160p - Professional quality',
  },
} as const;

type ExportQuality = keyof typeof EXPORT_QUALITY_PRESETS;

interface EChartsExportDialogProps {
  testNumber: string;
  testName: string;
  config: PressureTestConfig;
}

export function EChartsExportDialog({
  testNumber,
  testName,
  config,
}: EChartsExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('PNG');
  const [exportQuality, setExportQuality] = useState<ExportQuality>('FHD');
  const [showWorkingLine, setShowWorkingLine] = useState(true);
  const [showMaxLine, setShowMaxLine] = useState(true);
  const [enableDrift, setEnableDrift] = useState(false);
  const [enableCanvasStyle, setEnableCanvasStyle] = useState(false);

  // Data placement and field selection options
  const [dataPlacement, setDataPlacement] = useState<'title' | 'below' | 'overlay' | 'none'>('below');
  const [dataFields, setDataFields] = useState({
    testNumber: true,
    date: true,
    pressureTemp: true,
    equipmentId: false,
    operatorName: false,
  });

  // Collapsible sections state (all open by default)
  const [qualityOpen, setQualityOpen] = useState(true);
  const [optionsOpen, setOptionsOpen] = useState(true);
  const [dataDisplayOpen, setDataDisplayOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);

  // Sanitize test duration
  const sanitizedDuration = config.testDuration > 0 ? config.testDuration : 24;

  /**
   * Generate compact data display text based on selected fields and placement
   *
   * @param separator - Separator between fields (default: '  •  ')
   * @returns Formatted text string with selected metadata fields
   */
  const generateCompactDataText = (separator: string = '  •  '): string => {
    const parts: string[] = [];
    const pressureUnit = config.pressureUnit || 'MPa';
    const temperatureUnit = config.temperatureUnit || 'C';

    if (dataFields.testNumber && testNumber) {
      parts.push(`Test №${testNumber}`);
    }

    if (dataFields.date && config.startDateTime) {
      const date = new Date(config.startDateTime);
      const dateStr = date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      parts.push(`Date: ${dateStr}`);
    }

    if (dataFields.pressureTemp && config.workingPressure) {
      let pressureTempStr = `Working: ${config.workingPressure} ${pressureUnit}`;
      if (config.temperature) {
        pressureTempStr += ` | Temp: ${config.temperature}°${temperatureUnit}`;
      }
      parts.push(pressureTempStr);
    }

    if (dataFields.equipmentId && config.equipmentId) {
      parts.push(`Equipment: ${config.equipmentId}`);
    }

    if (dataFields.operatorName && config.operatorName) {
      parts.push(`Operator: ${config.operatorName}`);
    }

    return parts.join(separator);
  };

  /**
   * Generate pressure profile data points dynamically
   * Uses drift simulation when enabled, idealized data otherwise
   *
   * @param useDrift - Whether to apply realistic drift simulation
   * @returns Array of [minutes, pressure] data points
   */
  const generateProfileData = (useDrift: boolean): [number, number][] => {
    const totalMinutes = sanitizedDuration * 60;
    const rampUpDuration = 0.5; // 30 seconds
    const depressurizeDuration = 0.5; // 30 seconds

    // Use realistic drift simulation if enabled
    if (useDrift) {
      // Convert test parameters to milliseconds for drift simulator
      const startTimeMs = 0;
      const endTimeMs = totalMinutes * 60 * 1000;
      const rampDuration = 30 * 1000; // 30 seconds in milliseconds

      // Convert intermediate stages to absolute time format
      const stages: Array<{ startTime: number; endTime: number; pressure: number }> = [];
      let currentTimeMs = rampUpDuration * 60 * 1000; // After initial ramp-up

      const intermediateStages = config.intermediateStages || [];
      if (intermediateStages.length > 0) {
        intermediateStages.forEach((stage: IntermediateStage) => {
          // Add wait time after previous stage
          currentTimeMs += stage.time * 60 * 1000;
          const stageStartMs = currentTimeMs;
          const stageEndMs = stageStartMs + stage.duration * 60 * 1000;

          stages.push({
            startTime: stageStartMs,
            endTime: stageEndMs,
            pressure: stage.pressure,
          });

          currentTimeMs = stageEndMs + rampDuration; // Account for ramp down
        });
      }

      // Generate realistic data with drift and noise
      const realisticData = generateRealisticTestData(
        {
          startTime: startTimeMs,
          endTime: endTimeMs,
          workingPressure: config.workingPressure,
          intermediateStages: stages,
        },
        {
          driftMagnitude: 0.002, // ±0.2% drift
          noiseMagnitude: 0.001, // ±0.1% noise
          samplingRate: 1, // 1 second intervals
          seed: Date.now(),
        }
      );

      // Convert milliseconds to minutes for chart display
      return convertToMinutes(realisticData, startTimeMs);
    }

    // Idealized data (no drift)
    const dataPoints: [number, number][] = [];

    // Start: 0 pressure at time 0
    dataPoints.push([0, 0]);

    // Ramp up to working pressure
    dataPoints.push([rampUpDuration, config.workingPressure]);

    let currentTime = rampUpDuration;

    // Add intermediate stages
    const stages = config.intermediateStages || [];
    stages.forEach((stage: IntermediateStage) => {
      currentTime += stage.time;
      const stageStartMinutes = currentTime;

      // Ramp to stage pressure
      dataPoints.push([stageStartMinutes, stage.pressure]);

      // Hold at stage pressure
      const stageEndMinutes = stageStartMinutes + stage.duration;
      if (stageEndMinutes < totalMinutes - depressurizeDuration) {
        dataPoints.push([stageEndMinutes, stage.pressure]);

        // Return to working pressure
        dataPoints.push([stageEndMinutes + 0.5, config.workingPressure]);
        currentTime = stageEndMinutes + 0.5;
      } else {
        currentTime = stageEndMinutes;
      }
    });

    // Hold at working pressure until near end
    const depressurizeStartTime = totalMinutes - depressurizeDuration;
    if (currentTime < depressurizeStartTime) {
      dataPoints.push([depressurizeStartTime, config.workingPressure]);
    }

    // Depressurize to 0
    dataPoints.push([totalMinutes, 0]);

    return dataPoints;
  };

  /**
   * Handle export using ECharts Best Practices
   *
   * Supports three export formats:
   * - PNG: Raster image with configurable resolution
   * - SVG: Vector graphics for perfect scaling
   * - PDF: Professional document format (landscape A4)
   *
   * Implementation follows the recommended approach:
   * 1. Create hidden container with export dimensions
   * 2. Initialize new ECharts instance at target resolution
   * 3. Set devicePixelRatio during init (not just in getDataURL)
   * 4. Apply full chart options at export resolution
   * 5. Export using appropriate method for selected format
   * 6. Properly dispose instance to prevent memory leaks
   *
   * This approach ensures:
   * - No scaling artifacts (renders at native resolution)
   * - Crisp, professional output
   * - Wide 16:9 aspect ratio
   * - Proper memory cleanup
   */
  const handleExport = async () => {
    setIsExporting(true);

    let exportChart: ECharts | null = null;

    try {
      // Step 1: Get quality preset dimensions
      const qualityPreset = EXPORT_QUALITY_PRESETS[exportQuality];
      const exportWidth = qualityPreset.width;
      const exportHeight = qualityPreset.height;
      const pixelRatio = qualityPreset.pixelRatio;

      const hiddenContainer = document.createElement('div');
      hiddenContainer.style.width = `${exportWidth}px`;
      hiddenContainer.style.height = `${exportHeight}px`;
      hiddenContainer.style.position = 'absolute';
      hiddenContainer.style.left = '-9999px';
      hiddenContainer.style.top = '0';
      document.body.appendChild(hiddenContainer);

      // Step 2: Initialize dedicated ECharts instance with export dimensions
      // CRITICAL: Set devicePixelRatio during init, not just in getDataURL
      // Use SVG renderer for SVG export, Canvas for PNG/PDF
      exportChart = echarts.init(hiddenContainer, undefined, {
        renderer: exportFormat === 'SVG' ? 'svg' : 'canvas',
        width: exportWidth,
        height: exportHeight,
        devicePixelRatio: exportFormat === 'SVG' ? 1 : pixelRatio, // SVG doesn't need pixel ratio
      });

      // Step 3: Calculate optimal interval for export with improved logic
      // New requirements: 1h intervals up to 30h, then scale up appropriately
      const calculateInterval = (durationHours: number): number => {
        // Updated thresholds per user requirements
        if (durationHours <= 30) {
          return 60; // 1 hour intervals for tests up to 30 hours
        } else if (durationHours <= 60) {
          return 120; // 2 hour intervals for 30-60 hour tests
        } else if (durationHours <= 96) {
          return 180; // 3 hour intervals for 60-96 hour tests (4 days)
        } else {
          return 240; // 4 hour intervals for tests longer than 96 hours
        }
      };

      const xAxisInterval = calculateInterval(sanitizedDuration);

      const pressureUnit = config.pressureUnit || 'MPa';

      // Determine if we should use time-based X-axis (when Test Schedule is set)
      const useTimeBased = Boolean(config.startDateTime && config.endDateTime);
      const startTime = useTimeBased && config.startDateTime
        ? new Date(config.startDateTime).getTime()
        : 0;
      const endTime = useTimeBased && config.endDateTime
        ? new Date(config.endDateTime).getTime()
        : 0;
      const paddingHours = 1; // 1 hour padding before/after

      // Generate profile data dynamically based on drift setting
      const profileData = generateProfileData(enableDrift);

      // Generate data text if placement is not 'none'
      const dataText = dataPlacement !== 'none' ? generateCompactDataText() : '';

      // Step 4: Apply chart options at export resolution
      // CRITICAL: Sanitize all text for SVG export to prevent XML parsing errors
      const sanitizedTestNumber = sanitizeForSVG(testNumber);
      const sanitizedTestName = sanitizeForSVG(testName);
      const sanitizedDataText = sanitizeForSVG(dataText);

      let exportOption: any = {
        backgroundColor: '#ffffff', // White background for professional output
        title: {
          text: sanitizedTestNumber ? `Test №${sanitizedTestNumber}` : sanitizedTestName || 'Pressure Test',
          left: 'center',
          top: 10, // REDUCED from 20 to minimize space above title
          textStyle: {
            fontSize: 18,
            fontWeight: 600,
            color: '#1f2937',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          },
          // Add subtitle if placement is 'title'
          ...(dataPlacement === 'title' && sanitizedDataText
            ? {
                subtext: sanitizedDataText,
                subtextStyle: {
                  fontSize: 11,
                  color: '#6b7280',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
                },
              }
            : {}),
        },
        grid: {
          left: 60, // REDUCED from '10%' for tighter left margin (matches v1: 80px base, but adjusted for export)
          right: 40, // REDUCED from '8%' for tighter right margin (matches v1: 50px)
          bottom: dataPlacement === 'below' && dataText ? 100 : 80, // REDUCED from '20%'/'15%' for tighter bottom margin
          top: 60, // REDUCED from '20%' to minimize space between title and graph
          // containLabel removed - using explicit margins instead per ECharts v6 best practices
        },
        // Add graphic elements for data display based on placement
        ...(dataPlacement === 'below' && sanitizedDataText
          ? {
              graphic: [
                {
                  type: 'text',
                  left: 'center',
                  bottom: '8%', // REDUCED from '12%' to bring data text closer to graph
                  style: {
                    text: sanitizedDataText,
                    fontSize: 11,
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
                    fill: '#6b7280',
                    textAlign: 'center',
                  },
                },
              ],
            }
          : dataPlacement === 'overlay' && sanitizedDataText
            ? {
                graphic: [
                  {
                    type: 'group',
                    left: 20,
                    top: 80,
                    children: [
                      {
                        type: 'rect',
                        shape: {
                          x: 0,
                          y: 0,
                          width: Math.max(200, sanitizedDataText.length * 5),
                          height: 60,
                        },
                        style: {
                          fill: 'rgba(255, 255, 255, 0.95)',
                          stroke: '#d1d5db',
                          strokeWidth: 1,
                          shadowBlur: 4,
                          shadowColor: 'rgba(0, 0, 0, 0.1)',
                          shadowOffsetX: 0,
                          shadowOffsetY: 2,
                        },
                      },
                      {
                        type: 'text',
                        left: 10,
                        top: 15,
                        style: {
                          text: sanitizeForSVG(generateCompactDataText('\n')),
                          fontSize: 11,
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
                          fill: '#374151',
                          textAlign: 'left',
                        },
                      },
                    ],
                  },
                ],
              }
            : {}),
        xAxis: {
          type: 'value' as const,
          name: useTimeBased ? 'Дата и время' : 'Время',
          nameLocation: 'middle' as const,
          nameGap: 30,
          nameTextStyle: {
            fontSize: 14,
            color: '#1f2937',
            fontWeight: 500,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          },
          min: useTimeBased ? -paddingHours * 60 : 0,
          max: useTimeBased
            ? (endTime - startTime) / (60 * 1000) + paddingHours * 60
            : sanitizedDuration * 60,
          interval: xAxisInterval,
          minInterval: xAxisInterval,
          maxInterval: xAxisInterval,
          axisLabel: {
            show: true, // CRITICAL: Explicitly enable axis labels for export
            formatter: (value: number) => {
              if (useTimeBased) {
                // Convert minutes offset to actual date/time
                const timestamp = startTime + value * 60 * 1000;
                const date = new Date(timestamp);
                const dateStr = date.toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
                const timeStr = date.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return `${dateStr}\n${timeStr}`;
              } else {
                // Duration format
                if (value === 0) return '0';
                const hours = Math.floor(value / 60);
                const mins = Math.round(value % 60);
                if (hours === 0) return `${mins}m`;
                if (mins === 0) return `${hours}h`;
                return `${hours}h ${mins}m`;
              }
            },
            fontSize: useTimeBased ? 10 : 12,
            color: '#4b5563',
            rotate: 0,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#9ca3af',
              width: 1.5,
            },
          },
          axisTick: {
            show: true,
            length: 6,
            lineStyle: {
              color: '#9ca3af',
              width: 1.5,
            },
          },
          minorTick: {
            show: true,
            splitNumber: 6, // 6 minor ticks = 10-minute intervals (60min / 6 = 10min)
            length: 4,
            lineStyle: {
              color: '#d1d5db',
              width: 1,
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed' as const,
              color: '#e5e7eb',
            },
          },
        },
        yAxis: {
          type: 'value',
          name: `Давление, ${pressureUnit}`,
          nameLocation: 'middle',
          nameGap: 50,
          nameTextStyle: {
            fontSize: 14,
            color: '#1f2937',
            fontWeight: 500,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          },
          min: 0,
          max: Math.ceil((config.maxPressure * 1.1) / 5) * 5,
          interval: 5,
          axisLabel: {
            formatter: '{value}',
            fontSize: 12,
            color: '#4b5563',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          },
          axisLine: {
            lineStyle: {
              color: '#9ca3af',
              width: 1.5,
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              type: 'solid',
              color: '#e5e7eb',
            },
          },
        },
        // No dataZoom in exports - show clean graph without zoom controls
        // No toolbox in exports - clean professional output
        toolbox: {
          show: false,
        },
        series: [
          {
            name: 'Pressure Profile',
            type: 'line',
            data: profileData,
            smooth: enableDrift, // Smooth curve for realistic drift, sharp for idealized
            symbol: 'none',
            sampling: enableDrift ? 'lttb' : undefined, // Downsample high-frequency drift data
            lineStyle: {
              width: enableDrift ? 2 : 3, // Thinner line for high-frequency drift data
              color: '#3b82f6',
            },
            // Area fill with solid color (no gradient)
            areaStyle: {
              color: 'rgba(59, 130, 246, 0.15)', // Solid semi-transparent blue
            },
            markLine: {
              silent: true,
              symbol: 'none',
              lineStyle: {
                type: 'solid',
                width: 2,
              },
              label: {
                position: 'end',
                fontSize: 12,
                fontWeight: 500,
              },
              data: [
                ...(showWorkingLine
                  ? [
                      {
                        name: 'Working Pressure',
                        yAxis: config.workingPressure,
                        lineStyle: {
                          color: '#10b981',
                          type: 'dashed' as const,
                          width: 2,
                        },
                        label: {
                          formatter: `Working: ${config.workingPressure} ${pressureUnit}`,
                          color: '#10b981',
                        },
                      },
                    ]
                  : []),
                ...(showMaxLine
                  ? [
                      {
                        name: 'Max Pressure',
                        yAxis: config.maxPressure,
                        lineStyle: {
                          color: '#ef4444',
                          type: 'dashed' as const,
                          width: 2,
                        },
                        label: {
                          formatter: `Max: ${config.maxPressure} ${pressureUnit}`,
                          color: '#ef4444',
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
        ],
        animation: false, // Disable animation for export
      } as ECOption;

      // Apply Canvas-style configuration if enabled
      if (enableCanvasStyle) {
        exportOption = applyCanvasStyle(exportOption, 'light') as ECOption;
      }

      // Apply options to export instance
      exportChart.setOption(exportOption as any);

      // Step 5: Export using appropriate method for selected format
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const baseFilename = `${testNumber}_${testName.replace(/[^a-z0-9]/gi, '_')}_export_${timestamp}`;

      if (exportFormat === 'PNG') {
        // PNG export using getDataURL
        const imageDataUrl = exportChart.getDataURL({
          type: 'png',
          pixelRatio: pixelRatio,
          backgroundColor: '#ffffff',
        });

        const link = document.createElement('a');
        link.download = `${baseFilename}.png`;
        link.href = imageDataUrl;
        link.click();

        toast.success('PNG Export Successful', {
          description: `${qualityPreset.label} export completed: ${exportWidth * pixelRatio}×${exportHeight * pixelRatio} pixels`,
        });
      } else if (exportFormat === 'SVG') {
        // SVG export using renderToSVGString with comprehensive error handling
        try {
          console.log('[SVG Export] Starting SVG generation...');

          // Step 1: Attempt to generate SVG string from ECharts
          let svgStr: string;
          try {
            svgStr = exportChart.renderToSVGString();
            console.log('[SVG Export] SVG string generated successfully, length:', svgStr.length);
          } catch (renderError) {
            console.error('[SVG Export] ECharts renderToSVGString() failed:', renderError);
            throw new Error('ECharts failed to generate SVG. This may be due to complex graphic elements. Try PNG format instead.');
          }

          // Step 2: Clean and validate SVG
          let cleanedSvg: string;
          try {
            cleanedSvg = cleanSVGForExport(svgStr);
            console.log('[SVG Export] SVG cleaned successfully');
          } catch (cleanError) {
            console.error('[SVG Export] SVG cleaning failed:', cleanError);
            // Try to use the raw SVG anyway
            cleanedSvg = svgStr;
            console.warn('[SVG Export] Using raw SVG without cleaning');
          }

          // Step 3: Create blob and download
          try {
            const blob = new Blob([cleanedSvg], {
              type: 'image/svg+xml;charset=utf-8',
            });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.download = `${baseFilename}.svg`;
            link.href = url;
            link.click();

            // Clean up blob URL
            setTimeout(() => URL.revokeObjectURL(url), 100);

            console.log('[SVG Export] SVG downloaded successfully');
            toast.success('SVG Export Successful', {
              description: `Vector graphics export completed: ${exportWidth}×${exportHeight} (scalable)`,
            });
          } catch (blobError) {
            console.error('[SVG Export] Blob creation or download failed:', blobError);
            throw new Error('Failed to create SVG file. Please try PNG format instead.');
          }
        } catch (svgError) {
          console.error('[SVG Export] Overall SVG export failed:', svgError);

          // Provide specific error message
          const errorMessage = svgError instanceof Error
            ? svgError.message
            : 'The SVG export failed. Please try PNG or PDF format instead.';

          toast.error('SVG Export Failed', {
            description: errorMessage,
            duration: 7000,
          });

          // Don't re-throw - allow user to try again with different format
          return; // Exit early, don't close dialog
        }
      } else if (exportFormat === 'PDF') {
        // PDF export using jsPDF
        const { jsPDF } = await import('jspdf');

        // Create PDF in landscape orientation (A4)
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4', // 297mm × 210mm
        });

        // Get PNG data URL for embedding in PDF
        const imageDataUrl = exportChart.getDataURL({
          type: 'png',
          pixelRatio: 2, // High quality for PDF
          backgroundColor: '#ffffff',
        });

        // Calculate dimensions to fit A4 landscape with minimal margins
        const pdfWidth = 297; // A4 width in mm
        const pdfHeight = 210; // A4 height in mm
        const margin = 5; // REDUCED from 10mm to 5mm for tighter spacing
        const imgWidth = pdfWidth - 2 * margin;
        const imgHeight = pdfHeight - 2 * margin;

        // Add image to PDF
        pdf.addImage(imageDataUrl, 'PNG', margin, margin, imgWidth, imgHeight);

        // Add metadata
        pdf.setProperties({
          title: `${testName} - Pressure Test Graph`,
          subject: `Test ${testNumber}`,
          author: 'Pressograph 2.0',
          keywords: 'pressure test, graph, export',
          creator: 'Pressograph 2.0',
        });

        // Save PDF
        pdf.save(`${baseFilename}.pdf`);

        toast.success('PDF Export Successful', {
          description: `Professional PDF document created: A4 Landscape (297×210mm)`,
        });
      }

      // Clean up: Remove hidden container
      document.body.removeChild(hiddenContainer);

      setOpen(false);
    } catch (error) {
      console.error('ECharts export failed:', error);
      toast.error('Export Failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred during export',
      });
    } finally {
      // Step 7: CRITICAL - Dispose export instance to prevent memory leaks
      if (exportChart) {
        exportChart.dispose();
        exportChart = null;
      }
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <FileImage className="mr-2 h-4 w-4" />
          Export Graph (ECharts)
        </Button>
      </DialogTrigger>
      <DialogContentFullscreen className="flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Export Graph (ECharts High-Quality)</DialogTitle>
          <DialogDescription>
            Export the pressure test graph as PNG using ECharts best practices with dedicated rendering instance.
            Configure quality, format, and display options below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Settings Grid - Responsive Multi-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Export Quality Section - Collapsible */}
            <Collapsible open={qualityOpen} onOpenChange={setQualityOpen}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CollapsibleTrigger className="flex w-full items-center justify-between text-left hover:opacity-80 transition-opacity">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings2 className="h-4 w-4" />
                      Export Quality
                    </CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${qualityOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CardDescription className="text-xs">Configure export resolution and quality</CardDescription>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {/* Format Selector */}
                    <div className="space-y-2">
                      <Label htmlFor="format-select" className="text-sm">Export Format</Label>
                      <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                        <SelectTrigger id="format-select" className="h-9">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PNG">
                            <div className="flex flex-col">
                              <span className="font-medium">PNG Image</span>
                              <span className="text-xs text-muted-foreground">
                                Raster image with configurable resolution
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="SVG">
                            <div className="flex flex-col">
                              <span className="font-medium">SVG Vector</span>
                              <span className="text-xs text-muted-foreground">
                                Scalable vector graphics (perfect for scaling)
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="PDF">
                            <div className="flex flex-col">
                              <span className="font-medium">PDF Document</span>
                              <span className="text-xs text-muted-foreground">
                                Professional A4 landscape document
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {exportFormat === 'PNG' && 'Bitmap format with pixel-based resolution'}
                        {exportFormat === 'SVG' && 'Vector format that scales perfectly to any size'}
                        {exportFormat === 'PDF' && 'Professional document format (A4 landscape)'}
                      </p>
                    </div>

                    {/* Quality Selector (only for PNG) */}
                    {exportFormat === 'PNG' && (
                      <div className="space-y-2">
                        <Label htmlFor="quality-select" className="text-sm">Resolution Preset</Label>
                        <Select value={exportQuality} onValueChange={(value) => setExportQuality(value as ExportQuality)}>
                          <SelectTrigger id="quality-select" className="h-9">
                            <SelectValue placeholder="Select quality" />
                          </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HD+">
                            <div className="flex flex-col">
                              <span className="font-medium">{EXPORT_QUALITY_PRESETS['HD+'].label}</span>
                              <span className="text-xs text-muted-foreground">
                                {EXPORT_QUALITY_PRESETS['HD+'].description}
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="FHD">
                            <div className="flex flex-col">
                              <span className="font-medium">{EXPORT_QUALITY_PRESETS.FHD.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {EXPORT_QUALITY_PRESETS.FHD.description}
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="QHD">
                            <div className="flex flex-col">
                              <span className="font-medium">{EXPORT_QUALITY_PRESETS.QHD.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {EXPORT_QUALITY_PRESETS.QHD.description}
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="4K">
                            <div className="flex flex-col">
                              <span className="font-medium">{EXPORT_QUALITY_PRESETS['4K'].label}</span>
                              <span className="text-xs text-muted-foreground">
                                {EXPORT_QUALITY_PRESETS['4K'].description}
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                        <p className="text-xs text-muted-foreground">
                          Display: {EXPORT_QUALITY_PRESETS[exportQuality].width} × {EXPORT_QUALITY_PRESETS[exportQuality].height} @ {EXPORT_QUALITY_PRESETS[exportQuality].pixelRatio}x pixel ratio
                          <br />
                          Effective: {EXPORT_QUALITY_PRESETS[exportQuality].width * EXPORT_QUALITY_PRESETS[exportQuality].pixelRatio} × {EXPORT_QUALITY_PRESETS[exportQuality].height * EXPORT_QUALITY_PRESETS[exportQuality].pixelRatio} pixels
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Export Options Section - Collapsible */}
            <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CollapsibleTrigger className="flex w-full items-center justify-between text-left hover:opacity-80 transition-opacity">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileImage className="h-4 w-4" />
                      Export Options
                    </CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${optionsOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CardDescription className="text-xs">Configure reference lines and display settings</CardDescription>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {/* Pressure Line Toggles */}
                    <div className="space-y-2">
                      <Label className="text-sm">Reference Lines</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="working-line"
                            checked={showWorkingLine}
                            onCheckedChange={(checked) => setShowWorkingLine(checked as boolean)}
                          />
                          <label
                            htmlFor="working-line"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Working Pressure ({config.workingPressure} {config.pressureUnit})
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="max-line"
                            checked={showMaxLine}
                            onCheckedChange={(checked) => setShowMaxLine(checked as boolean)}
                          />
                          <label
                            htmlFor="max-line"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Max Pressure ({config.maxPressure} {config.pressureUnit})
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Drift Simulation Toggle */}
                    <div className="space-y-2">
                      <Label className="text-sm">Rendering Quality</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enable-drift"
                            checked={enableDrift}
                            onCheckedChange={(checked) => setEnableDrift(checked as boolean)}
                          />
                          <label
                            htmlFor="enable-drift"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Realistic Drift
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enable-canvas-style"
                            checked={enableCanvasStyle}
                            onCheckedChange={(checked) => setEnableCanvasStyle(checked as boolean)}
                          />
                          <label
                            htmlFor="enable-canvas-style"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Canvas Style (v1.0)
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Drift: High-frequency sampling with Brownian motion.
                        <br />
                        Canvas: v1.0 visual styling.
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Data Display Section - Collapsible */}
            <Collapsible open={dataDisplayOpen} onOpenChange={setDataDisplayOpen}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CollapsibleTrigger className="flex w-full items-center justify-between text-left hover:opacity-80 transition-opacity">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings2 className="h-4 w-4" />
                      Data Display
                    </CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${dataDisplayOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CardDescription className="text-xs">Configure test metadata display on graph</CardDescription>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {/* Data Placement Selector */}
                    <div className="space-y-2">
                      <Label htmlFor="data-placement" className="text-sm">Data Placement</Label>
                      <Select value={dataPlacement} onValueChange={(value: any) => setDataPlacement(value)}>
                        <SelectTrigger id="data-placement" className="h-9">
                          <SelectValue placeholder="Select placement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="title">
                            <div className="flex flex-col">
                              <span className="font-medium">Below Title</span>
                              <span className="text-xs text-muted-foreground">
                                Display as subtitle below graph title
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="below">
                            <div className="flex flex-col">
                              <span className="font-medium">Below Graph</span>
                              <span className="text-xs text-muted-foreground">
                                Display between graph area and bottom edge
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="overlay">
                            <div className="flex flex-col">
                              <span className="font-medium">On Graph</span>
                              <span className="text-xs text-muted-foreground">
                                Overlay box on top-left of graph area
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="none">
                            <div className="flex flex-col">
                              <span className="font-medium">Do Not Display</span>
                              <span className="text-xs text-muted-foreground">
                                Hide all test metadata
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Data Fields Selection (only show if placement is not 'none') */}
                    {dataPlacement !== 'none' && (
                      <div className="space-y-2">
                        <Label className="text-sm">Display Fields</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="field-testNumber"
                              checked={dataFields.testNumber}
                              onCheckedChange={(checked) =>
                                setDataFields(prev => ({ ...prev, testNumber: !!checked }))
                              }
                            />
                            <Label htmlFor="field-testNumber" className="text-sm font-normal cursor-pointer">
                              Test Number
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="field-date"
                              checked={dataFields.date}
                              onCheckedChange={(checked) =>
                                setDataFields(prev => ({ ...prev, date: !!checked }))
                              }
                            />
                            <Label htmlFor="field-date" className="text-sm font-normal cursor-pointer">
                              Date
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="field-pressureTemp"
                              checked={dataFields.pressureTemp}
                              onCheckedChange={(checked) =>
                                setDataFields(prev => ({ ...prev, pressureTemp: !!checked }))
                              }
                            />
                            <Label htmlFor="field-pressureTemp" className="text-sm font-normal cursor-pointer">
                              Pressure | Temp
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="field-equipmentId"
                              checked={dataFields.equipmentId}
                              onCheckedChange={(checked) =>
                                setDataFields(prev => ({ ...prev, equipmentId: !!checked }))
                              }
                            />
                            <Label htmlFor="field-equipmentId" className="text-sm font-normal cursor-pointer">
                              Equipment ID
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="field-operatorName"
                              checked={dataFields.operatorName}
                              onCheckedChange={(checked) =>
                                setDataFields(prev => ({ ...prev, operatorName: !!checked }))
                              }
                            />
                            <Label htmlFor="field-operatorName" className="text-sm font-normal cursor-pointer">
                              Operator Name
                            </Label>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Select which metadata fields to display on the exported graph
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Test Information Section - Collapsible (Combined compact version) */}
            <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CollapsibleTrigger className="flex w-full items-center justify-between text-left hover:opacity-80 transition-opacity">
                    <CardTitle className="text-base">Test Info</CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${infoOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CardDescription className="text-xs">Configuration and export details</CardDescription>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-3 pt-0">
                    {/* Test Configuration */}
                    <div>
                      <h4 className="text-xs font-semibold mb-2">Test Configuration</h4>
                      <dl className="grid grid-cols-1 gap-2 text-xs">
                        <div>
                          <dt className="font-medium text-muted-foreground">Test Number</dt>
                          <dd className="text-foreground">{testNumber}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-muted-foreground">Test Name</dt>
                          <dd className="text-foreground">{testName}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-muted-foreground">Pressure Range</dt>
                          <dd className="text-foreground">
                            {config.workingPressure}-{config.maxPressure} {config.pressureUnit}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-muted-foreground">Duration</dt>
                          <dd className="text-foreground">{config.testDuration}h</dd>
                        </div>
                        {config.intermediateStages && config.intermediateStages.length > 0 && (
                          <div>
                            <dt className="font-medium text-muted-foreground">Stages</dt>
                            <dd className="text-foreground">{config.intermediateStages.length} stage(s)</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Export Details */}
                    <div>
                      <h4 className="text-xs font-semibold mb-2">Export Details</h4>
                      <dl className="grid grid-cols-1 gap-2 text-xs">
                        <div>
                          <dt className="font-medium text-muted-foreground">Quality</dt>
                          <dd className="text-foreground">{EXPORT_QUALITY_PRESETS[exportQuality].label}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-muted-foreground">Resolution</dt>
                          <dd className="text-foreground">
                            {EXPORT_QUALITY_PRESETS[exportQuality].width * EXPORT_QUALITY_PRESETS[exportQuality].pixelRatio} × {EXPORT_QUALITY_PRESETS[exportQuality].height * EXPORT_QUALITY_PRESETS[exportQuality].pixelRatio}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-muted-foreground">Reference Lines</dt>
                          <dd className="text-foreground">
                            {showWorkingLine && showMaxLine ? 'Both' : showWorkingLine ? 'Working' : showMaxLine ? 'Max' : 'None'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
          {/* Graph Preview - Always visible */}
          <Card>
            <CardHeader>
              <CardTitle>Graph Preview</CardTitle>
              <CardDescription>
                Preview of the graph that will be exported (export will be rendered at higher resolution)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PressureTestPreview
                workingPressure={config.workingPressure}
                maxPressure={config.maxPressure}
                testDuration={config.testDuration}
                intermediateStages={config.intermediateStages || []}
                pressureUnit={config.pressureUnit || 'MPa'}
                startDateTime={config.startDateTime}
                endDateTime={config.endDateTime}
                showWorkingLine={showWorkingLine}
                enableCanvasStyle={enableCanvasStyle}
                showMaxLine={showMaxLine}
                enableDrift={enableDrift}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Download className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {exportFormat}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContentFullscreen>
    </Dialog>
  );
}
