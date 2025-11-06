'use client';

/**
 * Dashboard Sidebar Navigation
 *
 * Responsive sidebar with:
 * - Main navigation links
 * - Active route highlighting
 * - Mobile collapse/expand
 * - Logo and branding
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  FolderIcon,
  FlaskConicalIcon,
  BarChart3Icon,
  SettingsIcon,
  HelpCircleIcon,
  ChevronLeftIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: HomeIcon,
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: FolderIcon,
  },
  {
    href: '/tests',
    label: 'Tests',
    icon: FlaskConicalIcon,
  },
  {
    href: '/docs',
    label: 'Documentation',
    icon: HelpCircleIcon,
  },
  {
    href: '/api-docs',
    label: 'API Docs',
    icon: BarChart3Icon,
  },
];

const bottomNavItems: NavItem[] = [
  {
    href: '/settings',
    label: 'Settings',
    icon: SettingsIcon,
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'bg-card border-border flex h-full flex-col border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo and Brand */}
      <div className="border-border flex h-16 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
            <BarChart3Icon className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold">Pressograph</span>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
                active && 'bg-accent text-accent-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-border border-t p-3">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
                active && 'bg-accent text-accent-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Collapse Toggle (Desktop only) */}
      {onToggle && (
        <div className="border-border hidden border-t p-2 md:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeftIcon
              className={cn(
                'h-4 w-4 transition-transform',
                collapsed && 'rotate-180'
              )}
            />
            {!collapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      )}
    </aside>
  );
}
