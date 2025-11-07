'use client';

import { useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  startDateTime?: string;
  endDateTime?: string;
  triggerClassName?: string;
}

/**
 * Full-Screen Preview Dialog Component
 *
 * Displays the pressure test graph in a large modal dialog for better visibility.
 * Uses shadcn/ui Dialog component with maximized content area.
 *
 * Features:
 * - Full-screen modal with large graph
 * - Close button and ESC key support
 * - Maintains aspect ratio
 * - Responsive design
 *
 * @example
 * ```typescript
 * <PreviewDialog
 *   workingPressure={10}
 *   maxPressure={15}
 *   testDuration={24}
 *   intermediateStages={stages}
 *   pressureUnit="MPa"
 * />
 * ```
 */
export function PreviewDialog({
  workingPressure,
  maxPressure,
  testDuration,
  intermediateStages = [],
  pressureUnit = 'MPa',
  startDateTime,
  endDateTime,
  triggerClassName,
}: PreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={triggerClassName}
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          Full Screen Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[85vh] flex flex-col p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            Pressure Test Preview
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto mt-4">
          <PressureTestPreview
            workingPressure={workingPressure}
            maxPressure={maxPressure}
            testDuration={testDuration}
            intermediateStages={intermediateStages}
            pressureUnit={pressureUnit}
            startDateTime={startDateTime}
            endDateTime={endDateTime}
            className="h-full min-h-[600px]"
          />
        </div>

        {/* Close button */}
        <div className="flex justify-end gap-2 mt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
