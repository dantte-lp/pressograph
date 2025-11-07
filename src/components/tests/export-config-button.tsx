'use client';

/**
 * Export Test Configuration Button Component
 *
 * Provides a button for exporting test configurations to JSON format.
 * Includes metadata and proper file naming.
 */

import { FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportTestConfig } from '@/lib/utils/test-config-io';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';

interface ExportConfigButtonProps {
  config: PressureTestConfig;
  testNumber?: string;
  testName?: string;
  description?: string;
  includeMetadata?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
}

export function ExportConfigButton({
  config,
  testNumber,
  testName,
  description,
  includeMetadata = true,
  variant = 'outline',
  size = 'default',
  disabled = false,
  className,
}: ExportConfigButtonProps) {
  const handleExport = () => {
    try {
      exportTestConfig({
        config,
        testNumber,
        name: testName,
        description,
        includeMetadata,
      });

      toast.success('Configuration exported successfully', {
        description: `Saved as pressure_test_${testNumber || 'config'}.json`,
      });
    } catch (error) {
      console.error('[ExportConfigButton] Export failed:', error);
      toast.error('Failed to export configuration', {
        description: (error as Error).message,
      });
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={disabled}
      className={className}
    >
      <FileJson className="mr-2 h-4 w-4" />
      Export JSON
    </Button>
  );
}
