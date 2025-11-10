'use client';

/**
 * Dashboard Layout Component
 *
 * Enhanced responsive dashboard layout with:
 * - Collapsible sidebar with smooth animations
 * - Header with user menu
 * - Main content area
 * - Mobile-responsive behavior using Sheet component
 * - Better accessibility and UX
 */

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { DashboardHeaderClient } from './dashboard-header';
import { type Locale } from '@/components/locale-switcher';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  /**
   * Current locale (passed from Server Component)
   */
  locale: Locale;
  /**
   * User role for conditional navigation display
   */
  userRole?: string;
}

export function DashboardLayout({ children, title, locale, userRole }: DashboardLayoutProps) {
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
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} userRole={userRole} />
      </div>

      {/* Mobile Sidebar using Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>
              Access dashboard navigation and settings
            </SheetDescription>
          </SheetHeader>
          <Sidebar userRole={userRole} />
        </SheetContent>
      </Sheet>

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
