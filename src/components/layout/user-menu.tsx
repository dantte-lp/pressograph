'use client';

/**
 * User Menu Component
 *
 * Client component for user menu dropdown with authentication actions.
 * Extracted from DashboardHeader to maintain Server Component pattern.
 */

import { UserIcon, LogOutIcon, SettingsIcon } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
        <a href="/api/auth/signin">Sign in</a>
      </Button>
    );
  }

  return (
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
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
