/**
 * useToast Hook
 *
 * Wrapper around sonner toast library for consistent toast notifications
 */

'use client';

import { toast as sonnerToast } from 'sonner';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant = 'default', duration = 4000 }: ToastOptions) => {
    const message = title || description || '';
    const detailedDescription = title && description ? description : undefined;

    if (variant === 'destructive') {
      sonnerToast.error(message, {
        description: detailedDescription,
        duration,
      });
    } else {
      sonnerToast.success(message, {
        description: detailedDescription,
        duration,
      });
    }
  };

  return {
    toast,
  };
}
