'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
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
import { RefreshCw, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Register ECharts components
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
>;

interface IntermediateStage {
  time: number; // minutes
  pressure: number;
  duration: number; // minutes
}

interface GraphSettings {
  yAxisMax: number | null;
  yAxisMin: number;
  autoScaleY: boolean;
  xAxisMax: number | null;
  autoScaleX: boolean;
}

interface PressureTestPreviewEnhancedProps {
  workingPressure: number;
  maxPressure: number;
  testDuration: number; // hours
  intermediateStages?: IntermediateStage[];
  pressureUnit?: 'MPa' | 'Bar' | 'PSI';
  className?: string;
  title?: string; // Custom graph title
  showDescription?: boolean; // Show description section below graph
  temperature?: number; // Operating temperature
}

/**
 * Enhanced PressureTestPreview Component
 *
 * Features:
 * - Manual recalculate button
 * - Axis scaling configuration (Y-axis min/max, auto-scale toggles)
 * - Professional styling adapted from old Pressograph v1
 * - ECharts 6.0 integration with tree-shaking
 */
export function PressureTestPreviewEnhanced({
  workingPressure,
  maxPressure,
  testDuration,
  intermediateStages = [],
  pressureUnit = 'MPa',
  className = '',
  title,
  showDescription = true,
  temperature,
}: PressureTestPreviewEnhancedProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);
  const [recalcKey, setRecalcKey] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Graph settings state
  const [graphSettings, setGraphSettings] = useState<GraphSettings>({
    yAxisMax: null,
    yAxisMin: 0,
    autoScaleY: true,
    xAxisMax: null,
    autoScaleX: true,
  });

  // Manual recalculate trigger
  const handleRecalculate = () => {
    setRecalcKey((prev) => prev + 1);
  };

  // Calculate pressure profile data points
  const profileData = useMemo(() => {
    const totalMinutes = testDuration * 60;
    const rampUpDuration = totalMinutes * 0.1; // 10% of total time for ramp up
    const depressurizeDuration = totalMinutes * 0.05; // 5% of total time for depressurization

    const dataPoints: [number, number][] = [];
    const timeLabels: string[] = [];

    // Helper to format time
    const formatTime = (minutes: number): string => {
      if (minutes === 0) return '0';
      if (minutes < 60) return `${Math.round(minutes)}m`;
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    // Start: 0 pressure at time 0
    dataPoints.push([0, 0]);
    timeLabels.push('0');

    // Ramp up to working pressure (similar to old 30 seconds ramp)
    dataPoints.push([rampUpDuration, workingPressure]);
    timeLabels.push(formatTime(rampUpDuration));

    let currentTime = rampUpDuration;

    // Add intermediate stages
    if (intermediateStages && intermediateStages.length > 0) {
      intermediateStages.forEach((stage) => {
        // Drop from working pressure to stage pressure (if needed)
        const dropStartTime = Math.max(currentTime, Math.min(stage.time - 0.5, totalMinutes - depressurizeDuration));
        if (dropStartTime > currentTime) {
          // Add point at working pressure before drop
          dataPoints.push([dropStartTime, workingPressure]);
          timeLabels.push(formatTime(dropStartTime));
        }

        // Transition to stage pressure
        const stageStartTime = Math.min(stage.time, totalMinutes - depressurizeDuration);
        if (stageStartTime > currentTime) {
          dataPoints.push([stageStartTime, stage.pressure]);
          timeLabels.push(formatTime(stageStartTime));
        }

        // Hold at stage pressure
        const stageEndTime = Math.min(stageStartTime + stage.duration, totalMinutes - depressurizeDuration);
        if (stageEndTime > stageStartTime) {
          dataPoints.push([stageEndTime, stage.pressure]);
          timeLabels.push(formatTime(stageEndTime));
        }

        // Return to working pressure after stage
        const returnTime = Math.min(stageEndTime + 0.5, totalMinutes - depressurizeDuration);
        if (returnTime <= totalMinutes - depressurizeDuration) {
          dataPoints.push([returnTime, workingPressure]);
          timeLabels.push(formatTime(returnTime));
        }

        currentTime = returnTime;
      });
    }

    // Hold at working pressure until near end
    const depressurizeStartTime = totalMinutes - depressurizeDuration;
    if (currentTime < depressurizeStartTime) {
      dataPoints.push([depressurizeStartTime, workingPressure]);
      timeLabels.push(formatTime(depressurizeStartTime));
    }

    // Depressurize to 0
    dataPoints.push([totalMinutes, 0]);
    timeLabels.push(formatTime(totalMinutes));

    return { dataPoints, timeLabels };
  }, [workingPressure, testDuration, intermediateStages, recalcKey]);

  // Calculate axis bounds
  const axisBounds = useMemo(() => {
    const totalMinutes = testDuration * 60;

    // Y-axis bounds (adapted from old Pressograph: pressureMax = Math.ceil(maxPressure * 1.1 / 5) * 5)
    let yMax: number;
    if (graphSettings.autoScaleY || graphSettings.yAxisMax === null) {
      const pressureMaxRaw = maxPressure * 1.1;
      yMax = Math.ceil(pressureMaxRaw / 5) * 5;
    } else {
      yMax = graphSettings.yAxisMax;
    }

    // X-axis bounds
    let xMax: number;
    if (graphSettings.autoScaleX || graphSettings.xAxisMax === null) {
      xMax = totalMinutes * 1.05; // 5% buffer (adapted from old 5% time buffer)
    } else {
      xMax = graphSettings.xAxisMax;
    }

    return {
      yMin: graphSettings.yAxisMin,
      yMax,
      xMax,
      yInterval: 5, // Always use 5 MPa intervals
    };
  }, [maxPressure, testDuration, graphSettings]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart if not exists
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const chart = chartInstance.current;

    // Configure chart options (Russian labels matching export)
    const option: ECOption = {
      title: {
        text: title || 'Предварительный просмотр испытания',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const point = params[0];
          const minutes = point.data[0];
          const pressure = point.data[1];

          const hours = Math.floor(minutes / 60);
          const mins = Math.round(minutes % 60);
          const timeStr = hours > 0
            ? `${hours}h ${mins}m`
            : `${mins}m`;

          return `
            <div style="padding: 4px;">
              <strong>Time:</strong> ${timeStr}<br/>
              <strong>Pressure:</strong> ${pressure.toFixed(2)} ${pressureUnit}
            </div>
          `;
        },
      },
      legend: {
        data: ['Pressure Profile', 'Working Pressure', 'Max Pressure'],
        top: 30,
        textStyle: {
          fontSize: 11,
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '20%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: 'Время',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: {
          fontSize: 11,
        },
        min: 0,
        max: axisBounds.xMax,
        axisLabel: {
          formatter: (value: number) => {
            if (value === 0) return '0';
            const hours = Math.floor(value / 60);
            const mins = Math.round(value % 60);
            if (hours === 0) return `${mins}m`;
            if (mins === 0) return `${hours}h`;
            return `${hours}h${mins}m`;
          },
          fontSize: 10,
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#f0f0f0',
          },
        },
      },
      yAxis: {
        type: 'value',
        name: `Давление, ${pressureUnit}`,
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: {
          fontSize: 11,
        },
        min: axisBounds.yMin,
        max: axisBounds.yMax,
        interval: axisBounds.yInterval, // 5 MPa intervals
        axisLabel: {
          formatter: '{value}',
          fontSize: 10,
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'solid',
            color: '#f0f0f0',
          },
        },
      },
      series: [
        {
          name: 'Pressure Profile',
          type: 'line',
          data: profileData.dataPoints,
          smooth: false,
          lineStyle: {
            width: 2,
            color: '#0066cc', // Adapted from old Pressograph color
          },
          itemStyle: {
            color: '#0066cc',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(173, 216, 230, 0.3)' }, // Adapted from old lightblue fill
                { offset: 1, color: 'rgba(173, 216, 230, 0.05)' },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              type: 'solid',
              width: 1,
            },
            label: {
              position: 'end',
              fontSize: 10,
            },
            data: [
              {
                name: 'Working Pressure',
                yAxis: workingPressure,
                lineStyle: {
                  color: '#10b981',
                  type: 'dashed',
                },
                label: {
                  formatter: `Working: ${workingPressure} ${pressureUnit}`,
                  color: '#10b981',
                },
              },
              {
                name: 'Max Pressure',
                yAxis: maxPressure,
                lineStyle: {
                  color: '#ef4444',
                  type: 'dashed',
                },
                label: {
                  formatter: `Max: ${maxPressure} ${pressureUnit}`,
                  color: '#ef4444',
                },
              },
            ],
          },
        },
      ],
    };

    chart.setOption(option, { notMerge: true });

    // Handle resize
    const handleResize = () => {
      chart?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [workingPressure, maxPressure, testDuration, intermediateStages, pressureUnit, profileData, axisBounds, recalcKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {/* Header with Recalculate Button */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Preview</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRecalculate}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Recalculate
        </Button>
      </div>

      {/* Chart Canvas */}
      <div
        ref={chartRef}
        className="w-full"
        style={{ height: '400px', minHeight: '300px' }}
      />

      {/* Description Section (adapted from V1 styling) */}
      {showDescription && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-semibold mb-3">Test Configuration</h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Working Pressure:</span>
              <span className="font-medium">{workingPressure} {pressureUnit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Pressure:</span>
              <span className="font-medium">{maxPressure} {pressureUnit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Test Duration:</span>
              <span className="font-medium">{testDuration} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intermediate Stages:</span>
              <span className="font-medium">{intermediateStages?.length || 0}</span>
            </div>
            {temperature !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temperature:</span>
                <span className="font-medium">{temperature}°C</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pressure Unit:</span>
              <span className="font-medium">{pressureUnit}</span>
            </div>
          </div>
        </div>
      )}

      {/* Graph Settings */}
      <Collapsible
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        className="mt-3"
      >
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              <span>Graph Settings</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {isSettingsOpen ? 'Hide' : 'Show'}
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 p-4 bg-muted/30 rounded-lg border">
          <div className="space-y-4">
            {/* Y-Axis Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-scale-y" className="text-sm font-medium">
                  Auto Scale Y-Axis
                </Label>
                <Switch
                  id="auto-scale-y"
                  checked={graphSettings.autoScaleY}
                  onCheckedChange={(checked) =>
                    setGraphSettings((prev) => ({ ...prev, autoScaleY: checked }))
                  }
                />
              </div>

              {!graphSettings.autoScaleY && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="y-min" className="text-xs">
                      Y-Axis Min
                    </Label>
                    <Input
                      id="y-min"
                      type="number"
                      value={graphSettings.yAxisMin}
                      onChange={(e) =>
                        setGraphSettings((prev) => ({
                          ...prev,
                          yAxisMin: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="y-max" className="text-xs">
                      Y-Axis Max
                    </Label>
                    <Input
                      id="y-max"
                      type="number"
                      value={graphSettings.yAxisMax || ''}
                      onChange={(e) =>
                        setGraphSettings((prev) => ({
                          ...prev,
                          yAxisMax: parseFloat(e.target.value) || null,
                        }))
                      }
                      placeholder="Auto"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* X-Axis Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-scale-x" className="text-sm font-medium">
                  Auto Scale X-Axis
                </Label>
                <Switch
                  id="auto-scale-x"
                  checked={graphSettings.autoScaleX}
                  onCheckedChange={(checked) =>
                    setGraphSettings((prev) => ({ ...prev, autoScaleX: checked }))
                  }
                />
              </div>

              {!graphSettings.autoScaleX && (
                <div className="space-y-1">
                  <Label htmlFor="x-max" className="text-xs">
                    X-Axis Max (minutes)
                  </Label>
                  <Input
                    id="x-max"
                    type="number"
                    value={graphSettings.xAxisMax || ''}
                    onChange={(e) =>
                      setGraphSettings((prev) => ({
                        ...prev,
                        xAxisMax: parseFloat(e.target.value) || null,
                      }))
                    }
                    placeholder="Auto"
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground">
              Changes apply immediately to the graph above
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
