'use client';

import { ChevronLeftIcon, MaximizeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContentFullscreen,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PressureTestPreview } from './pressure-test-preview';

/**
 * Represents an intermediate pressure stage in the test profile
 */
interface IntermediateStage {
  /** Minutes after previous stage's hold ends (relative time) */
  time: number;
  /** Target pressure for this stage */
  pressure: number;
  /** Duration to hold at this pressure (minutes) */
  duration: number;
}

/**
 * Props for the FullscreenPreviewDialog component
 */
interface FullscreenPreviewDialogProps {
  /** Trigger element (typically a button) */
  children?: React.ReactNode;
  /** Working (baseline) pressure for the test */
  workingPressure: number;
  /** Maximum pressure limit */
  maxPressure: number;
  /** Total test duration in hours */
  testDuration: number;
  /** Optional intermediate pressure stages */
  intermediateStages?: IntermediateStage[];
  /** Unit of measurement for pressure display */
  pressureUnit?: 'MPa' | 'Bar' | 'PSI';
  /** Unit of measurement for temperature display */
  temperatureUnit?: 'C' | 'F';
  /** ISO 8601 format start date/time (enables time-based axis) */
  startDateTime?: string;
  /** ISO 8601 format end date/time (enables time-based axis) */
  endDateTime?: string;
  /** Custom class name for trigger button */
  triggerClassName?: string;
  /** Show/hide working pressure reference line */
  showWorkingLine?: boolean;
  /** Show/hide max pressure reference line */
  showMaxLine?: boolean;
  /** Enable realistic pressure drift simulation */
  enableDrift?: boolean;
}

/**
 * Fullscreen Preview Dialog Component
 *
 * Displays pressure test graph in a fullscreen dialog for better viewing.
 * The dialog expands to fill the viewport with a small margin, providing
 * an immersive preview experience perfect for detailed graph inspection.
 *
 * Features:
 * - Fullscreen display (calc(100vh-2rem) × calc(100vw-2rem))
 * - ScrollArea for overflow content
 * - A4 Landscape container (297mm × 210mm) centered inside
 * - Back button with ChevronLeftIcon
 * - Clean, distraction-free viewing
 *
 * Use Cases:
 * - Detailed graph inspection before export
 * - Presentation mode for test profiles
 * - Mobile-friendly graph viewing
 * - Print preview
 *
 * @example
 * ```tsx
 * <FullscreenPreviewDialog
 *   workingPressure={10}
 *   maxPressure={15}
 *   testDuration={24}
 *   intermediateStages={stages}
 *   pressureUnit="MPa"
 *   temperatureUnit="C"
 * >
 *   <Button>Preview Fullscreen</Button>
 * </FullscreenPreviewDialog>
 * ```
 */
export function FullscreenPreviewDialog({
  children,
  workingPressure,
  maxPressure,
  testDuration,
  intermediateStages = [],
  pressureUnit = 'MPa',
  temperatureUnit = 'C',
  startDateTime,
  endDateTime,
  triggerClassName,
  showWorkingLine = true,
  showMaxLine = true,
  enableDrift = false,
}: FullscreenPreviewDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={triggerClassName || ''}
          >
            <MaximizeIcon className="h-4 w-4 mr-2" />
            Fullscreen Preview
          </Button>
        )}
      </DialogTrigger>
      <DialogContentFullscreen className="p-0">
        <ScrollArea className="h-full w-full">
          <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-xl">Pressure Test Preview</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Full-screen preview in A4 Landscape format (297mm × 210mm)
            </DialogDescription>
          </DialogHeader>

          {/* Content Area with centered A4 Landscape container */}
          <div className="flex items-center justify-center p-6 min-h-[calc(100vh-10rem)]">
            <div
              className="bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden"
              style={{
                width: '297mm',
                height: '210mm',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              <div className="w-full h-full p-6">
                <PressureTestPreview
                  workingPressure={workingPressure}
                  maxPressure={maxPressure}
                  testDuration={testDuration}
                  intermediateStages={intermediateStages}
                  pressureUnit={pressureUnit}
                  startDateTime={startDateTime}
                  endDateTime={endDateTime}
                  showWorkingLine={showWorkingLine}
                  showMaxLine={showMaxLine}
                  enableDrift={enableDrift}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background z-10">
          <DialogClose asChild>
            <Button variant="outline" size="default">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Close Preview
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContentFullscreen>
    </Dialog>
  );
}
