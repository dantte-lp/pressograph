'use client';

/**
 * Breadcrumb Navigation Component
 *
 * Dynamic breadcrumb navigation that automatically generates
 * breadcrumbs based on the current route path.
 *
 * Features:
 * - Automatic path parsing from current route
 * - Custom labels for routes
 * - Separator customization
 * - Home icon for root
 * - Keyboard accessible
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  className?: string;
  separator?: React.ReactNode;
  homeLabel?: string;
  /**
   * Custom labels for specific routes
   * Example: { '/projects': 'My Projects', '/tests/new': 'Create Test' }
   */
  customLabels?: Record<string, string>;
}

/**
 * Converts a path segment to a readable label
 * Example: 'my-project' -> 'My Project'
 */
function segmentToLabel(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function Breadcrumb({
  className,
  separator = <ChevronRightIcon className="h-4 w-4" />,
  homeLabel = 'Home',
  customLabels = {},
}: BreadcrumbProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    // Always start with home/dashboard
    const items: BreadcrumbItem[] = [
      { label: homeLabel, href: '/dashboard' },
    ];

    // Skip if we're on the dashboard
    if (pathname === '/dashboard') {
      return items;
    }

    // Split pathname and filter out empty segments
    const segments = pathname.split('/').filter(Boolean);

    // Build breadcrumb items
    let currentPath = '';
    segments.forEach((segment) => {
      currentPath += `/${segment}`;

      // Skip dashboard segment (already handled)
      if (segment === 'dashboard') {
        return;
      }

      // Use custom label if available, otherwise convert segment
      const label = customLabels[currentPath] || segmentToLabel(segment);

      items.push({
        label,
        href: currentPath,
      });
    });

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <li key={item.href} className="flex items-center space-x-1">
              {/* Separator (except for first item) */}
              {!isFirst && (
                <span className="text-muted-foreground" aria-hidden="true">
                  {separator}
                </span>
              )}

              {/* Breadcrumb Link or Current Page */}
              {isLast ? (
                <span
                  className="text-foreground font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href as any}
                  className={cn(
                    'text-muted-foreground hover:text-foreground transition-colors',
                    'focus-visible:ring-ring rounded focus-visible:outline-none focus-visible:ring-2'
                  )}
                >
                  {isFirst ? (
                    <HomeIcon className="h-4 w-4" aria-label={item.label} />
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
