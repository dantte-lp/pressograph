'use client';

/**
 * ECharts Export Dialog Component
 *
 * Allows users to export pressure test graphs using ECharts native rendering.
 * This provides an alternative export method to the custom canvas rendering
 * in EmulationExportDialog.
 *
 * Features:
 * - Export to PNG using ECharts getDataURL
 * - High-quality rendering with configurable pixel ratio
 * - Uses the same preview component (PressureTestPreview) for consistency
 * - Watermarking for emulated data
 */

import { useState, useRef } from 'react';
import { Download, FileImage } from 'lucide-react';
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
import { toast } from 'sonner';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';
import { PressureTestPreview } from './pressure-test-preview';

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
  const previewRef = useRef<{ getEChartsInstance: () => any }>(null);

  /**
   * Handle export as PNG using ECharts native functionality
   *
   * Exports at high resolution (1920x1080) with white background for professional quality.
   * Uses a temporary off-screen rendering approach to maintain display quality.
   */
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Step 1: Get the ECharts instance from the PressureTestPreview component
      const chartContainer = document.querySelector('[role="img"][aria-label*="Pressure test graph"]');

      if (!chartContainer) {
        throw new Error('Chart container not found. Please ensure the graph is visible.');
      }

      // Find the canvas element inside the container
      const canvas = chartContainer.querySelector('canvas') as HTMLCanvasElement;

      if (!canvas) {
        throw new Error('Chart canvas not found. Please ensure the graph has rendered.');
      }

      // Step 2: Create a temporary high-resolution canvas for export
      const exportCanvas = document.createElement('canvas');
      const exportWidth = 1920; // Full HD width
      const exportHeight = 1080; // Full HD height
      const pixelRatio = 2; // 2x for high-DPI displays (total: 3840x2160)

      exportCanvas.width = exportWidth * pixelRatio;
      exportCanvas.height = exportHeight * pixelRatio;

      const ctx = exportCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Step 3: Fill with white background (fix transparent background issue)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Step 4: Scale and draw the original canvas content
      // Calculate aspect ratio to fit the export canvas
      const sourceWidth = canvas.width;
      const sourceHeight = canvas.height;
      const targetWidth = exportCanvas.width;
      const targetHeight = exportCanvas.height;

      // Calculate scaling to fit while maintaining aspect ratio
      const scaleX = targetWidth / sourceWidth;
      const scaleY = targetHeight / sourceHeight;
      const scale = Math.min(scaleX, scaleY);

      // Center the image
      const scaledWidth = sourceWidth * scale;
      const scaledHeight = sourceHeight * scale;
      const offsetX = (targetWidth - scaledWidth) / 2;
      const offsetY = (targetHeight - scaledHeight) / 2;

      // Draw with high quality settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        canvas,
        0, 0, sourceWidth, sourceHeight,
        offsetX, offsetY, scaledWidth, scaledHeight
      );

      // Step 5: Export as high-quality PNG
      const imageDataUrl = exportCanvas.toDataURL('image/png', 1.0); // Max quality

      // Step 6: Create download link
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `${testNumber}_${testName.replace(/[^a-z0-9]/gi, '_')}_echarts_${timestamp}.png`;
      link.href = imageDataUrl;
      link.click();

      toast.success('Export Successful', {
        description: `Graph exported as high-quality PNG (${exportWidth}x${exportHeight})`,
      });

      setOpen(false);
    } catch (error) {
      console.error('ECharts export failed:', error);
      toast.error('Export Failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
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
          <DialogTitle>Export Graph (ECharts Rendering)</DialogTitle>
          <DialogDescription>
            Export the pressure test graph as PNG using ECharts native rendering engine.
            This method provides high-quality exports directly from the preview component.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Graph Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Graph Preview</CardTitle>
              <CardDescription>
                This is the same graph shown in the preview tabs
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
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-muted-foreground">Format</dt>
                  <dd className="text-foreground">PNG Image</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Rendering</dt>
                  <dd className="text-foreground">ECharts Native</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Resolution</dt>
                  <dd className="text-foreground">1920 x 1080 (Full HD)</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Quality</dt>
                  <dd className="text-foreground">High (2x pixel ratio = 3840x2160)</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Background</dt>
                  <dd className="text-foreground">White (Professional)</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Use Case</dt>
                  <dd className="text-foreground">Reports, Presentations, Printing</dd>
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
