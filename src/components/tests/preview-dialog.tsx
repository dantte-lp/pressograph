'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IntermediateStage {
  time: number;
  pressure: number;
  duration: number;
}

interface PreviewDialogProps {
  workingPressure: number;
  maxPressure: number;
  testDuration: number;
  intermediateStages?: IntermediateStage[];
  pressureUnit?: 'MPa' | 'Bar' | 'PSI';
  temperatureUnit?: 'C' | 'F';
  startDateTime?: string;
  endDateTime?: string;
  triggerClassName?: string;
}

/**
 * Preview Button Component
 *
 * Provides a button to open the pressure test preview in a new browser window.
 * The full-screen modal dialog has been removed per user request due to
 * landscape orientation issues.
 *
 * Features:
 * - Opens preview in new browser window
 * - A4 landscape format (297mm × 210mm)
 * - Optimized window dimensions
 * - Clean, print-ready display
 *
 * @example
 * ```typescript
 * <PreviewDialog
 *   workingPressure={10}
 *   maxPressure={15}
 *   testDuration={24}
 *   intermediateStages={stages}
 *   pressureUnit="MPa"
 *   temperatureUnit="C"
 * />
 * ```
 */
export function PreviewDialog({
  workingPressure,
  maxPressure,
  testDuration,
  intermediateStages = [],
  pressureUnit = 'MPa',
  temperatureUnit = 'C',
  startDateTime,
  endDateTime,
  triggerClassName,
}: PreviewDialogProps) {
  /**
   * Open preview in new browser window
   * Opens a dedicated A4 preview page with the test configuration
   *
   * Window is sized for A4 landscape format (297mm × 210mm)
   * with proper dimensions and positioning
   */
  const handleOpenInNewWindow = () => {
    // Prepare test configuration
    const testConfig = {
      workingPressure,
      maxPressure,
      testDuration,
      intermediateStages,
      pressureUnit,
      temperatureUnit,
      startDateTime,
      endDateTime,
    };

    // Encode configuration as base64 to avoid URL length issues
    const encodedConfig = btoa(JSON.stringify(testConfig));

    // Calculate A4 window dimensions (landscape)
    // A4 landscape ratio: 1.414:1
    const windowWidth = 1273; // Landscape width
    const windowHeight = 900; // Landscape height

    // Calculate window position (centered on screen)
    const left = Math.max(0, (window.screen.width - windowWidth) / 2);
    const top = Math.max(0, (window.screen.height - windowHeight) / 2);

    // Comprehensive window features to ensure browser respects dimensions
    const features = [
      `width=${windowWidth}`,
      `height=${windowHeight}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=yes',
      'toolbar=no',
      'menubar=no',
      'location=no',
      'directories=no',
      'status=yes',
    ].join(',');

    // Open new window with proper landscape dimensions
    const newWindow = window.open(`/preview?config=${encodedConfig}`, '_blank', features);

    // Fallback: If browser ignores features, resize window immediately
    if (newWindow) {
      try {
        newWindow.resizeTo(windowWidth, windowHeight);
        newWindow.moveTo(left, top);
      } catch (e) {
        // Some browsers may block resizing for security reasons
        console.warn('Window resize blocked by browser:', e);
      }
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleOpenInNewWindow}
      className={triggerClassName || ''}
    >
      <ExternalLink className="h-4 w-4 mr-2" />
      Open in New Window
    </Button>
  );
}
