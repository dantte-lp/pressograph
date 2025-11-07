'use client';

/**
 * A4 Landscape Preview Page for Pressure Tests
 *
 * This page displays pressure test graphs in A4 landscape format (297mm × 210mm)
 * with tick marks on the X-axis. Optimized for printing and opening in new browser windows.
 *
 * Features:
 * - A4 landscape format (1.414:1 aspect ratio)
 * - Tick marks on X-axis for professional appearance
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
import { X, Printer } from 'lucide-react';
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
            <X className="h-4 w-4 mr-2" />
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
    <div className="w-screen h-screen bg-white flex items-center justify-center p-0 m-0 overflow-hidden">
      {/* Minimal Print Button - Top Right Corner */}
      <div className="print:hidden fixed top-2 right-2 z-50 flex gap-1">
        <Button onClick={handlePrint} variant="ghost" size="sm" className="h-8 px-2">
          <Printer className="h-4 w-4" />
        </Button>
        <Button onClick={handleClose} variant="ghost" size="sm" className="h-8 px-2">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* A4 Landscape Graph - Full Screen */}
      <div
        className="bg-white print:w-full print:h-full"
        style={{
          width: '297mm',
          height: '210mm',
          maxWidth: '100vw',
          maxHeight: '100vh',
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
