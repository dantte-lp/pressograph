'use client';

/**
 * A4 Landscape Preview Page for Pressure Tests
 *
 * CLEAN PRINT-READY VERSION - NO UI ELEMENTS
 *
 * This page displays ONLY the pressure test graph in A4 landscape format (297mm × 210mm).
 * All UI elements (buttons, text, labels, sidebar, header) have been removed for clean printing.
 *
 * Features:
 * - A4 landscape format (1.414:1 aspect ratio)
 * - NO sidebar navigation
 * - NO header/top menu
 * - NO buttons (Close, Print)
 * - NO text labels
 * - ONLY the graph - clean and professional
 * - 1-hour padding before and after test
 * - Print-optimized styling
 *
 * URL Format:
 * /preview?config=<base64-encoded-json>
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
 * @module app/preview/page
 */

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
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

  // Simple error state - no buttons, just text
  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-900">{error}</p>
        </div>
      </div>
    );
  }

  // Simple loading state - no text
  if (!config) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // CLEAN VERSION: Only the graph, no buttons, no text, no UI elements
  // Note: Pass ACTUAL (non-padded) start/end times to A4PreviewGraph
  // The component will handle padding internally for proper graph rendering
  return (
    <div className="w-screen h-screen bg-white flex items-center justify-center p-0 m-0 overflow-hidden">
      {/* A4 Landscape Graph - ONLY THE GRAPH */}
      <div
        className="bg-white"
        style={{
          width: '297mm',
          height: '210mm',
          maxWidth: '100vw',
          maxHeight: '100vh',
          margin: 0,
          padding: 0,
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
          paddingHours={1}
        />
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <PreviewPageContent />
    </Suspense>
  );
}
