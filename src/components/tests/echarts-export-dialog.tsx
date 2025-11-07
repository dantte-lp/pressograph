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

import { useState, useMemo } from 'react';
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
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
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
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';
import { PressureTestPreview } from './pressure-test-preview';
import { applyCanvasStyle } from '@/lib/utils/echarts-canvas-style';
import {
  generateRealisticTestData,
  convertToMinutes,
} from '@/lib/utils/pressure-drift-simulator';
import {
  calculateZoomedTimeWindow,
  getZoomInterval,
  type TimeScale,
  type TimeWindow,
} from '@/lib/utils/time-zoom';

// Register ECharts components for export (tree-shaking optimization)
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
  ToolboxComponent,
  CanvasRenderer,
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
  const [exportQuality, setExportQuality] = useState<ExportQuality>('FHD');
  const [showWorkingLine, setShowWorkingLine] = useState(true);
  const [showMaxLine, setShowMaxLine] = useState(true);
  const [enableDrift, setEnableDrift] = useState(false);
  const [enableCanvasStyle, setEnableCanvasStyle] = useState(false);
  const [timeScale, setTimeScale] = useState<TimeScale>('auto');
  const [customWindow, setCustomWindow] = useState<TimeWindow>({ start: 0, end: 0 });
  const [exportZoomedView, setExportZoomedView] = useState(false);

  // Collapsible sections state (all open by default)
  const [qualityOpen, setQualityOpen] = useState(true);
  const [optionsOpen, setOptionsOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);

  // Sanitize test duration
  const sanitizedDuration = config.testDuration > 0 ? config.testDuration : 24;

  /**
   * Calculate zoomed time window using utility function
   */
  const zoomedTimeWindow = useMemo(() => {
    return calculateZoomedTimeWindow(
      sanitizedDuration,
      timeScale,
      customWindow.end > 0 ? customWindow : undefined
    );
  }, [sanitizedDuration, timeScale, customWindow]);

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
   * Implementation follows the recommended approach:
   * 1. Create hidden container with export dimensions
   * 2. Initialize new ECharts instance at target resolution
   * 3. Set devicePixelRatio during init (not just in getDataURL)
   * 4. Apply full chart options at export resolution
   * 5. Export using getDataURL with white background
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
      exportChart = echarts.init(hiddenContainer, undefined, {
        renderer: 'canvas',
        width: exportWidth,
        height: exportHeight,
        devicePixelRatio: pixelRatio, // 2x resolution: 3840x2160
      });

      // Step 3: Calculate optimal interval for export with improved logic
      // New requirements: 1h intervals up to 30h, then scale up appropriately
      const calculateXAxisInterval = (durationHours: number): number => {
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

      // Use zoomed duration for interval calculation if zoom is active
      const displayDuration = zoomedTimeWindow.isZoomed
        ? zoomedTimeWindow.durationHours
        : sanitizedDuration;
      const xAxisInterval = zoomedTimeWindow.isZoomed
        ? getZoomInterval(displayDuration)
        : calculateXAxisInterval(displayDuration);

      const pressureUnit = config.pressureUnit || 'MPa';

      // Generate profile data dynamically based on drift setting
      const profileData = generateProfileData(enableDrift);

      // Step 4: Apply chart options at export resolution
      let exportOption = {
        backgroundColor: '#ffffff', // White background for professional output
        title: {
          text: `${testName} - Pressure Profile`,
          left: 'center',
          top: 20,
          textStyle: {
            fontSize: 18,
            fontWeight: 600,
            color: '#1f2937',
          },
          subtext: `Test ${testNumber} | Duration: ${sanitizedDuration}h | ${config.workingPressure}-${config.maxPressure} ${pressureUnit}`,
          subtextStyle: {
            fontSize: 12,
            color: '#6b7280',
          },
        },
        grid: {
          left: '10%',
          right: '8%',
          bottom: '15%',
          top: '20%',
          containLabel: true,
        },
        xAxis: {
          type: 'value' as const,
          name: 'Время',
          nameLocation: 'middle' as const,
          nameGap: 30,
          nameTextStyle: {
            fontSize: 14,
            color: '#1f2937',
            fontWeight: 500,
          },
          min: zoomedTimeWindow.min,
          max: zoomedTimeWindow.max,
          interval: xAxisInterval,
          minInterval: xAxisInterval,
          maxInterval: xAxisInterval,
          axisLabel: {
            show: true, // CRITICAL: Explicitly enable axis labels for export
            formatter: (value: number) => {
              if (value === 0) return '0';
              const hours = Math.floor(value / 60);
              const mins = Math.round(value % 60);
              if (hours === 0) return `${mins}m`;
              if (mins === 0) return `${hours}h`;
              return `${hours}h ${mins}m`;
            },
            fontSize: 12,
            color: '#4b5563',
            rotate: 0,
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
            alignWithLabel: true,
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
          },
          min: 0,
          max: Math.ceil((config.maxPressure * 1.1) / 5) * 5,
          interval: 5,
          axisLabel: {
            formatter: '{value}',
            fontSize: 12,
            color: '#4b5563',
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
        // Add dataZoom only if NOT exporting zoomed view
        // This allows interactive zoom in the export preview
        ...(exportZoomedView
          ? {}
          : {
              dataZoom: [
                {
                  type: 'slider',
                  xAxisIndex: 0,
                  filterMode: 'none',
                  start: 0,
                  end: 100,
                  show: false, // Hide in export
                },
                {
                  type: 'inside',
                  xAxisIndex: 0,
                  filterMode: 'none',
                  start: 0,
                  end: 100,
                  disabled: true, // Disable in export
                },
              ],
            }),
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
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
                  { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
                ],
              },
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

      // Step 5: Export using getDataURL
      // Note: devicePixelRatio is already set during init, this just confirms it
      const imageDataUrl = exportChart.getDataURL({
        type: 'png',
        pixelRatio: pixelRatio,
        backgroundColor: '#ffffff',
      });

      // Step 6: Create download
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `${testNumber}_${testName.replace(/[^a-z0-9]/gi, '_')}_export_${timestamp}.png`;
      link.href = imageDataUrl;
      link.click();

      // Clean up: Remove hidden container
      document.body.removeChild(hiddenContainer);

      toast.success('Export Successful', {
        description: `${qualityPreset.label} export completed: ${exportWidth}×${exportHeight} @ ${pixelRatio}x (${exportWidth * pixelRatio}×${exportHeight * pixelRatio})`,
      });

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
                    {/* Quality Selector */}
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

                    {/* Time Scale Zoom Controls */}
                    <div className="space-y-2">
                      <Label htmlFor="time-scale-select" className="text-sm">Time Scale Zoom</Label>
                      <Select value={timeScale} onValueChange={(value) => setTimeScale(value as TimeScale)}>
                        <SelectTrigger id="time-scale-select" className="h-9">
                          <SelectValue placeholder="Select time scale" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Full Duration (1x)</SelectItem>
                          <SelectItem value="2x">First Half (2x)</SelectItem>
                          <SelectItem value="4x">First Quarter (4x)</SelectItem>
                          <SelectItem value="10x">First 10% (10x)</SelectItem>
                          <SelectItem value="1x">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>

                      {timeScale === '1x' && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label htmlFor="zoom-start" className="text-xs">Start (min)</Label>
                            <Input
                              id="zoom-start"
                              type="number"
                              placeholder="0"
                              min={0}
                              max={sanitizedDuration * 60}
                              value={customWindow.start}
                              onChange={(e) => setCustomWindow((prev) => ({ ...prev, start: Number(e.target.value) }))}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="zoom-end" className="text-xs">End (min)</Label>
                            <Input
                              id="zoom-end"
                              type="number"
                              placeholder={String(sanitizedDuration * 60)}
                              min={0}
                              max={sanitizedDuration * 60}
                              value={customWindow.end}
                              onChange={(e) => setCustomWindow((prev) => ({ ...prev, end: Number(e.target.value) }))}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {zoomedTimeWindow.isZoomed
                          ? `Showing ${zoomedTimeWindow.min}-${zoomedTimeWindow.max} min (${zoomedTimeWindow.durationHours.toFixed(1)}h)`
                          : 'Showing full test duration'}
                      </p>
                    </div>

                    {/* Export Zoomed View Toggle */}
                    <div className="space-y-2">
                      <Label className="text-sm">Export Behavior</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="export-zoomed"
                          checked={exportZoomedView}
                          onCheckedChange={(checked) => setExportZoomedView(checked as boolean)}
                        />
                        <label
                          htmlFor="export-zoomed"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Export only visible zoomed area
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        When enabled, only the currently zoomed portion will be exported.
                        Uncheck to export the full graph regardless of zoom state.
                      </p>
                    </div>
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
                timeScale={timeScale}
                timeWindow={customWindow.end > 0 ? customWindow : undefined}
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
                Export PNG
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContentFullscreen>
    </Dialog>
  );
}
