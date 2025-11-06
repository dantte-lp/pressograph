import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

/**
 * Spinner Component
 * Animated loading indicator
 */
export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
    </div>
  );
}

/**
 * Loading Overlay
 * Full-screen or container overlay with spinner
 */
interface LoadingOverlayProps {
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ fullScreen = false, message, className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm' : 'absolute inset-0 z-10 bg-background/50 backdrop-blur-sm',
        className
      )}
    >
      <Spinner size="lg" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

/**
 * Inline Loader
 * Small inline loading indicator with optional text
 */
interface InlineLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function InlineLoader({ text = 'Loading...', size = 'sm' }: InlineLoaderProps) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

/**
 * Button Loading State
 * Loading indicator for buttons
 */
export function ButtonLoader() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}
