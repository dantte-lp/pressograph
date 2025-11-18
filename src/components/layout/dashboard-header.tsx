'use client';

/**
 * Dashboard Header (Client Component)
 *
 * Top navigation bar for the dashboard with:
 * - Breadcrumb navigation
 * - Page title
 * - Theme toggle
 * - User menu
 * - Mobile menu toggle
 * - Language switcher
 *
 * NOTE: This is a Client Component. The locale is passed as a prop from the
 * parent Server Component to avoid next-intl context issues.
 */

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { LocaleSwitcher, type Locale } from '@/components/locale-switcher';
import { UserMenu } from '@/components/layout/user-menu';
import { MobileMenuToggle } from '@/components/layout/dashboard-header-client';
import { UpdateNotificationBadge } from '@/components/admin/update-notification-badge';

interface DashboardHeaderClientProps {
  /**
   * Current locale (passed from Server Component)
   */
  locale: Locale;
  /**
   * Page title to display (optional, breadcrumb will be used if not provided)
   */
  title?: string;
  /**
   * Callback for mobile menu toggle
   */
  onMobileMenuToggle?: () => void;
  /**
   * Show breadcrumb navigation (default: true)
   */
  showBreadcrumb?: boolean;
  /**
   * Custom labels for breadcrumb routes
   */
  breadcrumbLabels?: Record<string, string>;
}

export function DashboardHeaderClient({
  locale,
  title,
  onMobileMenuToggle,
  showBreadcrumb = true,
  breadcrumbLabels,
}: DashboardHeaderClientProps) {

  return (
    <header className="bg-card border-border sticky top-0 z-40 border-b">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Mobile Menu Toggle */}
        {onMobileMenuToggle && <MobileMenuToggle onToggle={onMobileMenuToggle} />}

        {/* Page Title or Breadcrumb */}
        <div className="flex flex-1 items-center gap-4">
          {title ? (
            <h1 className="text-xl font-semibold">{title}</h1>
          ) : showBreadcrumb ? (
            <Breadcrumb customLabels={breadcrumbLabels} />
          ) : null}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Update Notification Badge - Only visible to admins */}
          <UpdateNotificationBadge />

          {/* Language Switcher - Pass locale from server */}
          <LocaleSwitcher currentLocale={locale} size="sm" />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu - Extracted to separate client component */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
