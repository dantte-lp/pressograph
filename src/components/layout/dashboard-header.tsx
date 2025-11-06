'use client';

/**
 * Dashboard Header
 *
 * Top navigation bar for the dashboard with:
 * - Breadcrumb navigation
 * - Page title
 * - Theme toggle
 * - User menu
 * - Mobile menu toggle
 */

import { MenuIcon, UserIcon, LogOutIcon, SettingsIcon } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
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

export function DashboardHeader({
  title,
  onMobileMenuToggle,
  showBreadcrumb = true,
  breadcrumbLabels,
}: DashboardHeaderProps) {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-card border-border sticky top-0 z-40 border-b">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Mobile Menu Toggle */}
        {onMobileMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        )}

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
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-full"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-9 w-9 rounded-full"
                    />
                  ) : (
                    <UserIcon className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user?.name || 'User'}
                    </p>
                    <p className="text-muted-foreground text-xs leading-none">
                      {session.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/profile" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/settings" className="cursor-pointer">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer"
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm">
              <a href="/api/auth/signin">Sign in</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
