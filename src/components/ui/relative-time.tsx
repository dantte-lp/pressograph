'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * RelativeTime Component
 *
 * Displays relative time formatting (e.g., "2 hours ago") without hydration mismatches.
 * Shows absolute timestamp during SSR/initial render, then switches to relative time
 * after client-side mount.
 *
 * This prevents hydration errors by ensuring server and client render the same content initially.
 *
 * @example
 * ```tsx
 * <RelativeTime date={new Date()} />
 * <RelativeTime date="2025-11-07T10:00:00Z" fallbackFormat="PPp" />
 * ```
 */
interface RelativeTimeProps {
  /** Date to display (Date object or ISO string) */
  date: Date | string;
  /** Optional format string for fallback display (default: "PPp" - localized date/time) */
  fallbackFormat?: string;
  /** CSS class name */
  className?: string;
  /** Whether to add "ago" suffix (default: true) */
  addSuffix?: boolean;
}

export function RelativeTime({
  date,
  fallbackFormat = 'PPp',
  className = '',
  addSuffix = true,
}: RelativeTimeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // During SSR and initial render: show absolute timestamp
  if (!mounted) {
    return (
      <span className={className} suppressHydrationWarning>
        {format(dateObj, fallbackFormat)}
      </span>
    );
  }

  // After mount: show relative time
  return (
    <span className={className} title={format(dateObj, 'PPpp')}>
      {formatDistanceToNow(dateObj, { addSuffix })}
    </span>
  );
}

/**
 * Conditional RelativeTime Component
 *
 * Shows "Never" text when date is null/undefined, otherwise shows relative time.
 *
 * @example
 * ```tsx
 * <ConditionalRelativeTime date={lastRunDate} neverText="Never run" />
 * ```
 */
interface ConditionalRelativeTimeProps extends RelativeTimeProps {
  /** Text to show when date is null/undefined (default: "Never") */
  neverText?: string;
}

export function ConditionalRelativeTime({
  date,
  neverText = 'Never',
  ...props
}: Omit<ConditionalRelativeTimeProps, 'date'> & {
  date: Date | string | null | undefined;
}) {
  if (!date) {
    return <span className={props.className}>{neverText}</span>;
  }

  return <RelativeTime date={date} {...props} />;
}
