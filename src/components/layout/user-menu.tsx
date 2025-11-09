'use client';

/**
 * User Menu Component
 *
 * Client component for user menu dropdown with authentication actions.
 * Extracted from DashboardHeader to maintain Server Component pattern.
 *
 * Features:
 * - User avatar with fallback initials
 * - Enhanced dropdown menu with better UX
 * - Smooth transitions and hover effects
 * - Keyboard navigation support
 */

import { UserIcon, LogOutIcon, SettingsIcon, KeyRound } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Get user initials from name
 */
function getUserInitials(name?: string | null): string {
  if (!name) return 'U';

  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * UserMenu component
 *
 * Displays user avatar and dropdown menu with profile, settings, and sign out options.
 * Shows sign in button if user is not authenticated.
 *
 * @example
 * ```tsx
 * // In header (Server Component)
 * import { UserMenu } from '@/components/layout/user-menu';
 *
 * export default async function Header() {
 *   return (
 *     <header>
 *       <UserMenu />
 *     </header>
 *   );
 * }
 * ```
 */
export function UserMenu() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (!session) {
    return (
      <Button asChild variant="default" size="sm">
        <a href="/api/auth/signin">
          <KeyRound className="mr-2 h-4 w-4" />
          Sign in
        </a>
      </Button>
    );
  }

  const userInitials = getUserInitials(session.user?.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-ring hover:ring-offset-2"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={session.user?.image || undefined}
              alt={session.user?.name || 'User'}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-semibold leading-none">
              {session.user?.name || 'User'}
            </p>
            <p className="text-muted-foreground text-xs leading-none">
              {session.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="/profile"
            className="cursor-pointer transition-colors hover:bg-accent focus:bg-accent"
          >
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href="/settings"
            className="cursor-pointer transition-colors hover:bg-accent focus:bg-accent"
          >
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive transition-colors"
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
