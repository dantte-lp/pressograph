'use client';

/**
 * Import Test Configuration Button Component
 *
 * Provides a file input button for importing test configurations from JSON files.
 * Validates the imported data and calls a callback with the parsed configuration.
 */

import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { importTestConfig } from '@/lib/utils/test-config-io';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';

interface ImportConfigButtonProps {
  onImport: (config: Partial<PressureTestConfig>) => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
}

export function ImportConfigButton({
  onImport,
  variant = 'outline',
  size = 'default',
  disabled = false,
  className,
}: ImportConfigButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importTestConfig(
      file,
      (result) => {
        if (result.success && result.data) {
          onImport(result.data);
          toast.success('Test configuration imported successfully', {
            description: 'Form has been pre-filled with imported values.',
          });
        } else if (result.error) {
          // Error already shown by importTestConfig via onError callback
          console.error('[ImportConfigButton] Import failed:', result.error);
        }
      },
      (error) => {
        toast.error('Failed to import configuration', {
          description: error,
          duration: 5000,
        });
      }
    );

    // Reset input so the same file can be imported again
    e.target.value = '';
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Import test configuration from JSON file"
        disabled={disabled}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleButtonClick}
        disabled={disabled}
        className={className}
      >
        <Upload className="mr-2 h-4 w-4" />
        Import JSON
      </Button>
    </>
  );
}
