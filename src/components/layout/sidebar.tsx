'use client';

/**
 * Dashboard Sidebar Navigation
 *
 * Enhanced responsive sidebar with:
 * - Main navigation links with smooth transitions
 * - Nested menu support with expand/collapse
 * - Active route highlighting with visual indicators
 * - Mobile collapse/expand
 * - Logo and branding
 * - Improved hover states and animations
 * - Better visual hierarchy
 */

import { useState } from 'react';
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
  ChevronDownIcon,
  ChevronRightIcon,
  UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
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
    children: [
      { href: '/projects/active', label: 'Active Projects', icon: FolderIcon },
      { href: '/projects/archived', label: 'Archived', icon: FolderIcon },
    ],
  },
  {
    href: '/tests',
    label: 'Tests',
    icon: FlaskConicalIcon,
    children: [
      { href: '/tests/new', label: 'New Test', icon: FlaskConicalIcon },
      { href: '/tests/history', label: 'History', icon: FlaskConicalIcon },
    ],
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
    href: '/profile',
    label: 'Profile',
    icon: UserIcon,
  },
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const hasActiveChild = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((child) => isActive(child.href));
  };

  const toggleExpanded = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const hasActiveDescendant = hasActiveChild(item);

    if (hasChildren) {
      return (
        <div key={item.label}>
          <div className="flex items-center gap-1">
            {/* Main navigation link */}
            <Link
              href={item.href as any}
              className={cn(
                'group relative flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'hover:bg-accent hover:text-accent-foreground hover:shadow-sm',
                'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
                (active || hasActiveDescendant) && 'bg-accent text-accent-foreground shadow-sm',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator bar */}
              {(active || hasActiveDescendant) && (
                <span className="bg-primary absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r" />
              )}
              <Icon className={cn(
                'h-5 w-5 shrink-0 transition-transform duration-200',
                'group-hover:scale-110',
                (active || hasActiveDescendant) && 'text-primary'
              )} />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
            </Link>
            {/* Expand/collapse button */}
            {!collapsed && (
              <button
                onClick={() => toggleExpanded(item.label)}
                className={cn(
                  'flex items-center justify-center rounded-lg p-2 text-sm transition-all duration-200',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2'
                )}
                aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform duration-200" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 shrink-0 transition-transform duration-200" />
                )}
              </button>
            )}
          </div>
          {!collapsed && isExpanded && item.children && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-2">
              {item.children.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href as any}
        className={cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          'hover:bg-accent hover:text-accent-foreground hover:shadow-sm',
          'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
          active && 'bg-accent text-accent-foreground shadow-sm',
          collapsed && 'justify-center',
          depth > 0 && 'text-muted-foreground hover:text-foreground'
        )}
        title={collapsed ? item.label : undefined}
      >
        {/* Active indicator bar */}
        {active && (
          <span className="bg-primary absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r" />
        )}
        <Icon className={cn(
          'h-5 w-5 shrink-0 transition-transform duration-200',
          'group-hover:scale-110',
          active && 'text-primary'
        )} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'bg-card border-border flex h-full flex-col border-r transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo and Brand */}
      <div className="border-border flex h-16 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 font-semibold transition-all duration-200 hover:opacity-80"
        >
          <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-105">
            <BarChart3Icon className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">Pressograph</span>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted">
        {navItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Separator */}
      <Separator className="my-2" />

      {/* Bottom Navigation */}
      <div className="space-y-1 p-3">
        {bottomNavItems.map((item) => renderNavItem(item))}
      </div>

      {/* Collapse Toggle (Desktop only) */}
      {onToggle && (
        <div className="border-border hidden border-t p-2 md:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full transition-all duration-200 hover:bg-accent"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeftIcon
              className={cn(
                'h-4 w-4 transition-transform duration-300',
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
