'use client';

/**
 * Dashboard Header Client Wrapper
 *
 * Client component wrapper for interactive parts of the dashboard header.
 * This handles the mobile menu toggle button which requires onClick handler.
 */

import { MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileMenuToggleProps {
  /**
   * Callback for mobile menu toggle
   */
  onToggle: () => void;
}

/**
 * Mobile Menu Toggle Button
 *
 * Client component for the mobile menu toggle button.
 * Shows only on mobile devices (hidden on md and up).
 *
 * @example
 * ```tsx
 * <MobileMenuToggle onToggle={() => setIsOpen(!isOpen)} />
 * ```
 */
export function MobileMenuToggle({ onToggle }: MobileMenuToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="md:hidden"
      aria-label="Toggle menu"
    >
      <MenuIcon className="h-5 w-5" />
    </Button>
  );
}
