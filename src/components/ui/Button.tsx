// ═══════════════════════════════════════════════════════════════════
// HeroUI Button Wrapper Component
// ═══════════════════════════════════════════════════════════════════

import { Button as HeroButton, ButtonProps as HeroButtonProps } from '@heroui/react';
import { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends Omit<HeroButtonProps, 'color' | 'variant'> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantMap: Record<ButtonVariant, HeroButtonProps['color']> = {
  primary: 'primary',
  secondary: 'default',
  danger: 'danger',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', fullWidth = false, className = '', children, ...props }, ref) => {
    return (
      <HeroButton
        ref={ref}
        color={variantMap[variant]}
        fullWidth={fullWidth}
        className={className}
        {...props}
      >
        {children}
      </HeroButton>
    );
  }
);

Button.displayName = 'Button';
