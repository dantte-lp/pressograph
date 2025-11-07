'use client';

/**
 * Emulation Export Dialog Component
 *
 * Allows users to generate and export pressure test graphs without actually
 * running the test. This "Successful Emulation" mode creates simulated data
 * based on the test configuration.
 *
 * Features:
 * - Export to PNG, PDF, CSV, and JSON formats
 * - Clear watermarking to distinguish from real test data
 * - Preview of emulated graph
 * - Metadata inclusion
 */

import { useState, useRef, useEffect } from 'react';
import { Download, FileImage, FileText, FileSpreadsheet, FileJson, AlertTriangle } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';
import {
  generateEmulatedTestData,
  emulatedDataToCSV,
  emulatedDataToJSON,
} from '@/lib/utils/pressure-data-generator';
import {
  exportGraphAsPNG,
  exportGraphAsPDF,
  downloadFile,
  generateExportFilename,
  formatFileSize,
} from '@/lib/utils/graph-export';

interface EmulationExportDialogProps {
  testNumber: string;
  testName: string;
  config: PressureTestConfig;
}

type ExportFormat = 'png' | 'pdf' | 'csv' | 'json';

export function EmulationExportDialog({
  testNumber,
  testName,
  config,
}: EmulationExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render emulated graph on canvas when dialog opens
  useEffect(() => {
    if (open && canvasRef.current) {
      renderEmulatedGraph();
    }
  }, [open]);

  /**
   * Render emulated pressure graph on canvas
   * Matches v1 graph styling for consistency
   */
  const renderEmulatedGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate emulated data
    const emulatedData = generateEmulatedTestData(config);

    // Set canvas size with high DPI for crisp rendering
    const scale = 2;
    const displayWidth = 800;
    const displayHeight = 500;
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.scale(scale, scale);

    // V1 STYLING: Background color (white)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // V1 STYLING: Graph margins
    const margin = { top: 80, right: 50, bottom: 120, left: 80 };
    const graphWidth = displayWidth - margin.left - margin.right;
    const graphHeight = displayHeight - margin.top - margin.bottom;

    // V1 STYLING: Add time buffer (5% on each side)
    const timeRange = emulatedData.endDateTime.getTime() - emulatedData.startDateTime.getTime();
    const timeBuffer = timeRange * 0.05;
    const graphStartTime = new Date(emulatedData.startDateTime.getTime() - timeBuffer);
    const graphEndTime = new Date(emulatedData.endDateTime.getTime() + timeBuffer);
    const graphTimeRange = graphEndTime.getTime() - graphStartTime.getTime();

    // V1 STYLING: Pressure scaling
    const pressureMaxRaw = config.maxPressure * 1.1;
    const pressureMax = Math.ceil(pressureMaxRaw / 5) * 5;

    const xScale = (time: number) => {
      return margin.left + ((time - graphStartTime.getTime()) / graphTimeRange) * graphWidth;
    };

    const yScale = (pressure: number) => {
      return margin.top + graphHeight - (pressure / pressureMax) * graphHeight;
    };

    // V1 STYLING: Title
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(testName || 'Pressure Test Graph', displayWidth / 2, 40);

    // V1 STYLING: Draw axes
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + graphHeight);
    ctx.lineTo(margin.left + graphWidth, margin.top + graphHeight);
    ctx.stroke();

    // V1 STYLING: Grid lines (Y-axis) - light gray
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

    // V1 STYLING: Y-axis labels
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

    // V1 STYLING: Y-axis label
    ctx.save();
    ctx.translate(20, displayHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '14px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`Pressure, ${config.pressureUnit}`, 0, 0);
    ctx.restore();

    // V1 STYLING: Grid lines (X-axis) - darker gray
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

    // V1 STYLING: Fine grid lines (30 minutes)
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

    // V1 STYLING: Tick marks on time axis
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

    // V1 STYLING: X-axis label
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText('Time', displayWidth / 2, displayHeight - 60);

    // V1 STYLING: Draw pressure line with area fill
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

    // Add watermark for emulated data (less intrusive than before)
    ctx.save();
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
    ctx.translate(displayWidth / 2, displayHeight / 2);
    ctx.rotate(-Math.PI / 8);
    ctx.textAlign = 'center';
    ctx.fillText('EMULATED DATA', 0, 0);
    ctx.restore();

    // V1 STYLING: Information box (bottom center)
    ctx.fillStyle = 'black';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    const baseY = displayHeight - 45;
    ctx.fillText(`Test: ${testNumber}`, displayWidth / 2, baseY);
    ctx.fillText(`Working Pressure: ${config.workingPressure} ${config.pressureUnit} | Temperature: ${config.temperature}°${config.temperatureUnit}`, displayWidth / 2, baseY + 12);
  };

  /**
   * Format date time for display
   */
  const formatDateTime = (date: Date): string => {
    const dateStr = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} ${timeStr}`;
  };

  /**
   * Handle export in selected format
   */
  const handleExport = async () => {
    setIsExporting(true);

    try {
      switch (selectedFormat) {
        case 'png':
          await handleExportPNG();
          break;
        case 'pdf':
          await handleExportPDF();
          break;
        case 'csv':
          await handleExportCSV();
          break;
        case 'json':
          await handleExportJSON();
          break;
      }

      toast.success('Export Successful', {
        description: `Emulated test data exported as ${selectedFormat.toUpperCase()}`,
      });

      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export Failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export as PNG
   */
  const handleExportPNG = async () => {
    if (!canvasRef.current) {
      throw new Error('Canvas not available');
    }

    await exportGraphAsPNG(canvasRef.current, testNumber, testName, true);
  };

  /**
   * Export as PDF
   */
  const handleExportPDF = async () => {
    if (!canvasRef.current) {
      throw new Error('Canvas not available');
    }

    await exportGraphAsPDF(canvasRef.current, testNumber, testName, true, config);
  };

  /**
   * Export as CSV
   */
  const handleExportCSV = async () => {
    const emulatedData = generateEmulatedTestData(config);
    const csvContent = emulatedDataToCSV(emulatedData);

    const filename = generateExportFilename({
      testNumber,
      testName,
      format: 'csv',
      isEmulation: true,
    });

    downloadFile(csvContent, filename, 'text/csv');

    toast.success('CSV Exported', {
      description: `File size: ${formatFileSize(new Blob([csvContent]).size)}`,
    });
  };

  /**
   * Export as JSON
   */
  const handleExportJSON = async () => {
    const emulatedData = generateEmulatedTestData(config);
    const jsonContent = emulatedDataToJSON(emulatedData);

    const filename = generateExportFilename({
      testNumber,
      testName,
      format: 'json',
      isEmulation: true,
    });

    downloadFile(jsonContent, filename, 'application/json');

    toast.success('JSON Exported', {
      description: `File size: ${formatFileSize(new Blob([jsonContent]).size)}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Emulation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Successful Emulation</DialogTitle>
          <DialogDescription>
            Generate and export a simulated pressure test graph based on your test configuration
            without running the actual test.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Simulated Data</AlertTitle>
          <AlertDescription>
            This export will contain EMULATED data generated from your test configuration. It is
            NOT from an actual test run. All exported files will be clearly marked as simulated.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 py-4">
          {/* Graph Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Graph Preview</CardTitle>
              <CardDescription>Preview of the emulated pressure profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="border rounded-lg shadow-sm max-w-full h-auto"
                />
              </div>
            </CardContent>
          </Card>

          {/* Export Format Selection */}
          <div className="space-y-4">
            <Label>Select Export Format</Label>
            <RadioGroup value={selectedFormat} onValueChange={(v: string) => setSelectedFormat(v as ExportFormat)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="png" id="format-png" />
                  <Label htmlFor="format-png" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-5 w-5" />
                      <div>
                        <div className="font-medium">PNG Image</div>
                        <div className="text-sm text-muted-foreground">
                          High-quality raster image
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="pdf" id="format-pdf" />
                  <Label htmlFor="format-pdf" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <div>
                        <div className="font-medium">PDF Document</div>
                        <div className="text-sm text-muted-foreground">
                          Includes graph and metadata
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="csv" id="format-csv" />
                  <Label htmlFor="format-csv" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      <div>
                        <div className="font-medium">CSV Data</div>
                        <div className="text-sm text-muted-foreground">
                          Raw data points for analysis
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="json" id="format-json" />
                  <Label htmlFor="format-json" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-5 w-5" />
                      <div>
                        <div className="font-medium">JSON Data</div>
                        <div className="text-sm text-muted-foreground">
                          Structured data with metadata
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Test Configuration Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
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
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
