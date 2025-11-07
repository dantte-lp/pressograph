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
   */
  const renderEmulatedGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate emulated data
    const emulatedData = generateEmulatedTestData(config);

    // Set canvas size
    canvas.width = 800;
    canvas.height = 400;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add watermark
    ctx.save();
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = 'center';
    ctx.fillText('EMULATED DATA', 0, 0);
    ctx.restore();

    // Draw graph
    const padding = 60;
    const graphWidth = canvas.width - 2 * padding;
    const graphHeight = canvas.height - 2 * padding;

    // Find max pressure for scaling
    const maxPressure = Math.max(...emulatedData.points.map(p => p.pressure));
    const yScale = graphHeight / (maxPressure * 1.1); // 10% padding at top

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw pressure line
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const timeRange = emulatedData.endDateTime.getTime() - emulatedData.startDateTime.getTime();

    emulatedData.points.forEach((point, index) => {
      const x =
        padding +
        ((point.time.getTime() - emulatedData.startDateTime.getTime()) / timeRange) * graphWidth;
      const y = canvas.height - padding - point.pressure * yScale;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Add labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // X-axis label
    ctx.fillText('Time', canvas.width / 2, canvas.height - 20);

    // Y-axis label
    ctx.save();
    ctx.translate(20, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`Pressure (${config.pressureUnit})`, 0, 0);
    ctx.restore();

    // Title
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`${testName} - Emulated Profile`, canvas.width / 2, 30);
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
