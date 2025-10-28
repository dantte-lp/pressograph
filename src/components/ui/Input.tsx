// ═══════════════════════════════════════════════════════════════════
// HeroUI Input Wrapper Component
// ═══════════════════════════════════════════════════════════════════

import { Input as HeroInput, InputProps as HeroInputProps } from '@heroui/react';
import { forwardRef } from 'react';

interface InputProps extends Omit<HeroInputProps, 'label'> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <HeroInput
        ref={ref}
        label={label}
        description={helperText}
        errorMessage={error}
        isInvalid={!!error}
        variant="bordered"
        className={className}
        classNames={{
          label: 'text-sm font-medium',
          input: 'text-sm',
          description: 'text-xs',
        }}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
