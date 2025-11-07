'use client';

/**
 * Dashboard Layout Component
 *
 * Responsive dashboard layout with:
 * - Collapsible sidebar
 * - Header with user menu
 * - Main content area
 * - Mobile-responsive behavior
 */

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { DashboardHeaderClient } from './dashboard-header';
import { type Locale } from '@/components/locale-switcher';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  /**
   * Current locale (passed from Server Component)
   */
  locale: Locale;
}

export function DashboardLayout({ children, title, locale }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={toggleMobileMenu}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <div
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <Sidebar />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeaderClient
          title={title}
          onMobileMenuToggle={toggleMobileMenu}
          locale={locale}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
