'use client';

import { useState } from 'react';
import { Maximize2, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PressureTestPreview } from './pressure-test-preview';

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
 * Full-Screen Preview Dialog Component with A4 Landscape Format Support
 *
 * Displays the pressure test graph in a truly full-screen modal dialog
 * with A4 landscape aspect ratio (1.414:1) for optimal print preview.
 *
 * Features:
 * - True full-screen modal (width AND height maximized)
 * - A4 landscape format (297mm × 210mm aspect ratio)
 * - Button group with "Full Screen" and "Open in New Window" options
 * - Close button and ESC key support
 * - Responsive design with proper centering
 *
 * A4 Landscape Specifications:
 * - Aspect Ratio: √2:1 (approximately 1.414:1)
 * - Dimensions: 297mm × 210mm (width × height)
 * - Screen Equivalent: ~1123px × 794px
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
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Open preview in new browser window
   * Opens a dedicated A4 preview page with the test configuration
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
    const windowWidth = 1273; // Landscape width (was 900px portrait)
    const windowHeight = Math.round(windowWidth / 1.414); // ~900px

    // Open new window with A4 proportions
    const windowFeatures = `width=${windowWidth},height=${windowHeight},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`;
    window.open(`/tests/preview?config=${encodedConfig}`, '_blank', windowFeatures);
  };

  return (
    <>
      {/* Button Group: Full Screen + Open in New Window */}
      <div className="inline-flex rounded-lg border border-input shadow-sm">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`rounded-r-none border-0 shadow-none ${triggerClassName || ''}`}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Full Screen
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-none w-screen h-screen flex flex-col p-8 rounded-none"
            showCloseButton={false}
          >
            <DialogHeader className="flex-shrink-0 mb-4">
              <DialogTitle className="text-2xl font-bold">
                Pressure Test Preview - A4 Landscape Format
              </DialogTitle>
              <DialogDescription>
                Full-screen preview in A4 landscape format (297mm × 210mm). Press ESC to close.
              </DialogDescription>
            </DialogHeader>

            {/* A4 Container - Centered and properly sized */}
            <div className="flex-1 flex items-center justify-center overflow-auto">
              <div
                className="bg-background border-2 border-border shadow-2xl"
                style={{
                  width: '297mm',
                  height: '210mm',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  aspectRatio: '1.414 / 1',
                  padding: '20mm',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Graph Preview */}
                <PressureTestPreview
                  workingPressure={workingPressure}
                  maxPressure={maxPressure}
                  testDuration={testDuration}
                  intermediateStages={intermediateStages}
                  pressureUnit={pressureUnit}
                  startDateTime={startDateTime}
                  endDateTime={endDateTime}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Close button */}
            <div className="flex justify-end gap-2 mt-4 flex-shrink-0">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Close (ESC)
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Open in New Window Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenInNewWindow}
          className="rounded-l-none border-l-0 shadow-none"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          New Window
        </Button>
      </div>
    </>
  );
}
