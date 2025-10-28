// ═══════════════════════════════════════════════════════════════════
// HeroUI Select Wrapper Component
// ═══════════════════════════════════════════════════════════════════

import { Select as HeroSelect, SelectItem, SelectProps as HeroSelectProps } from '@heroui/react';
import { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<HeroSelectProps, 'label' | 'children'> {
  label: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className = '', ...props }, ref) => {
    return (
      <HeroSelect
        ref={ref}
        label={label}
        description={helperText}
        errorMessage={error}
        isInvalid={!!error}
        variant="bordered"
        className={className}
        classNames={{
          label: 'text-sm font-medium',
          value: 'text-sm',
          description: 'text-xs',
        }}
        {...props}
      >
        {options.map((option) => (
          <SelectItem key={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </HeroSelect>
    );
  }
);

Select.displayName = 'Select';
