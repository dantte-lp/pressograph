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
import { Download, FileImage, Settings2 } from 'lucide-react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECharts, ComposeOption } from 'echarts/core';
import type { LineSeriesOption } from 'echarts/charts';
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption,
} from 'echarts/components';
import {
  Dialog,
  DialogContent,
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
import { toast } from 'sonner';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';
import { PressureTestPreview } from './pressure-test-preview';

// Register ECharts components for export (tree-shaking optimization)
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

// Type-safe chart option composition
type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
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
 * Export quality presets
 */
const EXPORT_QUALITY_PRESETS = {
  HD: {
    width: 1920,
    height: 1080,
    pixelRatio: 2,
    label: 'Full HD (1080p)',
    description: '3840 × 2160 effective resolution',
  },
  '4K': {
    width: 3840,
    height: 2160,
    pixelRatio: 2,
    label: '4K UHD (2160p)',
    description: '7680 × 4320 effective resolution',
  },
  '8K': {
    width: 7680,
    height: 4320,
    pixelRatio: 2,
    label: '8K UHD (4320p)',
    description: '15360 × 8640 effective resolution',
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
  const [exportQuality, setExportQuality] = useState<ExportQuality>('4K');
  const [showWorkingLine, setShowWorkingLine] = useState(true);
  const [showMaxLine, setShowMaxLine] = useState(true);

  // Sanitize test duration
  const sanitizedDuration = config.testDuration > 0 ? config.testDuration : 24;

  /**
   * Calculate pressure profile data points
   * (Duplicated from PressureTestPreview for export - avoids component coupling)
   */
  const calculateProfileData = useMemo(() => {
    const totalMinutes = sanitizedDuration * 60;
    const rampUpDuration = 0.5; // 30 seconds
    const depressurizeDuration = 0.5; // 30 seconds

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
  }, [config, sanitizedDuration]);

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

      // Step 3: Calculate optimal interval for export
      const calculateXAxisInterval = (durationHours: number): number => {
        const targetTicks = 10;
        const commonIntervals = [1, 2, 3, 4, 6, 12, 24];
        const validIntervals: Array<{ interval: number; tickCount: number }> = [];

        for (const interval of commonIntervals) {
          const tickCount = durationHours / interval;
          if (tickCount >= 8 && tickCount <= 15) {
            validIntervals.push({ interval, tickCount });
          }
        }

        if (validIntervals.length > 0) {
          validIntervals.sort((a, b) => a.interval - b.interval);
          return validIntervals[0].interval * 60;
        }

        let bestInterval = commonIntervals[0];
        let bestDiff = Infinity;

        for (const interval of commonIntervals) {
          const tickCount = durationHours / interval;
          const diff = Math.abs(tickCount - targetTicks);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestInterval = interval;
          }
        }

        return bestInterval * 60;
      };

      const xAxisInterval = calculateXAxisInterval(sanitizedDuration);
      const pressureUnit = config.pressureUnit || 'MPa';
      const totalMinutes = sanitizedDuration * 60;

      // Step 4: Apply chart options at export resolution
      const exportOption: ECOption = {
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
          type: 'value',
          name: 'Время',
          nameLocation: 'middle',
          nameGap: 30,
          nameTextStyle: {
            fontSize: 14,
            color: '#1f2937',
            fontWeight: 500,
          },
          min: 0,
          max: totalMinutes,
          interval: xAxisInterval,
          minInterval: xAxisInterval,
          maxInterval: xAxisInterval,
          axisLabel: {
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
              type: 'dashed',
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
        series: [
          {
            name: 'Pressure Profile',
            type: 'line',
            data: calculateProfileData,
            smooth: false,
            symbol: 'none',
            lineStyle: {
              width: 3,
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
                          type: 'dashed',
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
                          type: 'dashed',
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
      };

      // Apply options to export instance
      exportChart.setOption(exportOption);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Graph (ECharts High-Quality)</DialogTitle>
          <DialogDescription>
            Export the pressure test graph as PNG using ECharts best practices with dedicated rendering instance.
            Configure quality, format, and display options below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Export Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Export Settings
              </CardTitle>
              <CardDescription>Configure export quality and display options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quality Selector */}
              <div className="space-y-2">
                <Label htmlFor="quality-select">Export Quality</Label>
                <Select value={exportQuality} onValueChange={(value) => setExportQuality(value as ExportQuality)}>
                  <SelectTrigger id="quality-select">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HD">
                      <div className="flex flex-col">
                        <span className="font-medium">{EXPORT_QUALITY_PRESETS.HD.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {EXPORT_QUALITY_PRESETS.HD.description}
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
                    <SelectItem value="8K">
                      <div className="flex flex-col">
                        <span className="font-medium">{EXPORT_QUALITY_PRESETS['8K'].label}</span>
                        <span className="text-xs text-muted-foreground">
                          {EXPORT_QUALITY_PRESETS['8K'].description}
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selected: {EXPORT_QUALITY_PRESETS[exportQuality].width} × {EXPORT_QUALITY_PRESETS[exportQuality].height} @ {EXPORT_QUALITY_PRESETS[exportQuality].pixelRatio}x
                  ({EXPORT_QUALITY_PRESETS[exportQuality].width * EXPORT_QUALITY_PRESETS[exportQuality].pixelRatio} × {EXPORT_QUALITY_PRESETS[exportQuality].height * EXPORT_QUALITY_PRESETS[exportQuality].pixelRatio} effective)
                </p>
              </div>

              {/* Pressure Line Toggles */}
              <div className="space-y-2">
                <Label>Reference Lines</Label>
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
                      Show Working Pressure Line ({config.workingPressure} {config.pressureUnit})
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
                      Show Max Pressure Line ({config.maxPressure} {config.pressureUnit})
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Graph Preview */}
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
              />
            </CardContent>
          </Card>

          {/* Export Info */}
          <Card>
            <CardHeader>
              <CardTitle>Export Details</CardTitle>
              <CardDescription>
                Following ECharts export best practices with dedicated instance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-muted-foreground">Format</dt>
                  <dd className="text-foreground">PNG Image (Lossless)</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Quality Preset</dt>
                  <dd className="text-foreground">{EXPORT_QUALITY_PRESETS[exportQuality].label}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Display Resolution</dt>
                  <dd className="text-foreground">
                    {EXPORT_QUALITY_PRESETS[exportQuality].width} × {EXPORT_QUALITY_PRESETS[exportQuality].height}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Effective Resolution</dt>
                  <dd className="text-foreground">
                    {EXPORT_QUALITY_PRESETS[exportQuality].width * EXPORT_QUALITY_PRESETS[exportQuality].pixelRatio} × {EXPORT_QUALITY_PRESETS[exportQuality].height * EXPORT_QUALITY_PRESETS[exportQuality].pixelRatio} ({EXPORT_QUALITY_PRESETS[exportQuality].pixelRatio}x DPI)
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Aspect Ratio</dt>
                  <dd className="text-foreground">16:9 (Wide)</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Rendering Method</dt>
                  <dd className="text-foreground">Dedicated Instance (No Scaling)</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Background</dt>
                  <dd className="text-foreground">White (Print-Ready)</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Reference Lines</dt>
                  <dd className="text-foreground">
                    {showWorkingLine && showMaxLine ? 'Both' : showWorkingLine ? 'Working Only' : showMaxLine ? 'Max Only' : 'None'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Test Configuration Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-muted-foreground">Test Number</dt>
                  <dd className="text-foreground">{testNumber}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Test Name</dt>
                  <dd className="text-foreground">{testName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Working Pressure</dt>
                  <dd className="text-foreground">
                    {config.workingPressure} {config.pressureUnit}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Max Pressure</dt>
                  <dd className="text-foreground">
                    {config.maxPressure} {config.pressureUnit}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Test Duration</dt>
                  <dd className="text-foreground">{config.testDuration} hours</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Temperature</dt>
                  <dd className="text-foreground">
                    {config.temperature}°{config.temperatureUnit}
                  </dd>
                </div>
                {config.intermediateStages && config.intermediateStages.length > 0 && (
                  <div className="col-span-2">
                    <dt className="font-medium text-muted-foreground">Intermediate Stages</dt>
                    <dd className="text-foreground">{config.intermediateStages.length} stage(s)</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
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
      </DialogContent>
    </Dialog>
  );
}
