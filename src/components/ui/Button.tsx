// ═══════════════════════════════════════════════════════════════════
// Reusable Button Component
// ═══════════════════════════════════════════════════════════════════

import { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', fullWidth = false, className = '', disabled, children, ...props }, ref) => {
    const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors border disabled:opacity-50 disabled:cursor-not-allowed';
    const widthStyles = fullWidth ? 'w-full' : '';
    const variantStyle = variantStyles[variant];

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyle} ${widthStyles} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
