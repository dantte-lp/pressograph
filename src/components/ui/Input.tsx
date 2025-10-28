// ═══════════════════════════════════════════════════════════════════
// Reusable Input Component with Label
// ═══════════════════════════════════════════════════════════════════

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`
            px-3 py-2 rounded-md border transition-colors
            bg-white dark:bg-gray-800
            border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        )}
        {helperText && !error && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
