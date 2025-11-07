'use client';

/**
 * A4 Preview Page for Pressure Tests
 *
 * This page displays pressure test graphs in A4 portrait format (210mm × 297mm)
 * with 30-minute interval tick marks on the X-axis. Optimized for printing and
 * opening in new browser windows.
 *
 * Features:
 * - A4 portrait format (1:1.414 aspect ratio)
 * - 30-minute intervals on X-axis (critical requirement)
 * - High-resolution rendering for print
 * - Print-optimized styling (@media print)
 * - Receives configuration via URL query parameter
 *
 * URL Format:
 * /tests/preview?config=<base64-encoded-json>
 *
 * Configuration Schema:
 * {
 *   workingPressure: number,
 *   maxPressure: number,
 *   testDuration: number,
 *   intermediateStages: Array<{time, pressure, duration}>,
 *   pressureUnit: 'MPa' | 'Bar' | 'PSI',
 *   temperatureUnit: 'C' | 'F',
 *   startDateTime?: string,
 *   endDateTime?: string
 * }
 *
 * @module app/(dashboard)/tests/preview/page
 */

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { A4PreviewGraph } from '@/components/tests/a4-preview-graph';

interface IntermediateStage {
  time: number;
  pressure: number;
  duration: number;
}

interface TestConfig {
  workingPressure: number;
  maxPressure: number;
  testDuration: number;
  intermediateStages?: IntermediateStage[];
  pressureUnit?: 'MPa' | 'Bar' | 'PSI';
  temperatureUnit?: 'C' | 'F';
  startDateTime?: string;
  endDateTime?: string;
}

function PreviewPageContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<TestConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const encodedConfig = searchParams.get('config');
      if (!encodedConfig) {
        setError('No configuration provided');
        return;
      }

      // Decode base64 configuration
      const decodedConfig = JSON.parse(atob(encodedConfig));
      setConfig(decodedConfig);
    } catch (err) {
      console.error('Failed to decode configuration:', err);
      setError('Invalid configuration data');
    }
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    window.close();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={handleClose} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Close Window
          </Button>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">A4 Print Preview</h1>
            <p className="text-sm text-muted-foreground">
              Pressure Test Preview - Ready for printing
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="default" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print (Ctrl+P)
            </Button>
            <Button onClick={handleClose} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* A4 Page Container */}
      <div className="container mx-auto py-8 print:p-0">
        <div
          className="mx-auto bg-white shadow-2xl print:shadow-none"
          style={{
            width: '210mm',
            minHeight: '297mm',
            aspectRatio: '1 / 1.414',
          }}
        >
          <A4PreviewGraph
            workingPressure={config.workingPressure}
            maxPressure={config.maxPressure}
            testDuration={config.testDuration}
            intermediateStages={config.intermediateStages || []}
            pressureUnit={config.pressureUnit || 'MPa'}
            temperatureUnit={config.temperatureUnit || 'C'}
            startDateTime={config.startDateTime}
            endDateTime={config.endDateTime}
          />
        </div>
      </div>

      {/* Print Instructions - Hidden when printing */}
      <div className="print:hidden container mx-auto px-4 pb-8">
        <div className="max-w-2xl mx-auto bg-background border rounded-lg p-6 space-y-3">
          <h2 className="font-semibold text-lg">Print Instructions</h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+P</kbd> or click "Print" button to open print dialog</li>
            <li>Set paper size to <strong>A4 (210mm × 297mm)</strong></li>
            <li>Select <strong>Portrait</strong> orientation</li>
            <li>Disable margins or set to minimum for best results</li>
            <li>Ensure "Background graphics" is enabled to print colors</li>
            <li>Graph displays 30-minute intervals on X-axis for professional reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      }
    >
      <PreviewPageContent />
    </Suspense>
  );
}
