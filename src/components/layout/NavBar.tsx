// ═══════════════════════════════════════════════════════════════════
// Navigation Bar Component
// ═══════════════════════════════════════════════════════════════════

import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, User } from '@heroui/react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageToggle } from '../ui/LanguageToggle';
import { useLanguage } from '../../i18n';
import { useAuthStore } from '../../store/useAuthStore';

export const NavBar = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <Navbar isBordered maxWidth="full" className="shadow-sm">
      <NavbarBrand>
        <svg className="w-6 h-6 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="font-bold text-inherit">Pressure Test Visualizer</p>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-3" justify="end">
        {/* Home */}
        <NavbarItem isActive>
          <Link href="/" color="foreground" className="font-medium flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t.home || 'Главная'}
          </Link>
        </NavbarItem>

        {/* History (authenticated only) */}
        {isAuthenticated && (
          <NavbarItem>
            <Link href="/history" color="foreground" className="font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.history || 'История'}
            </Link>
          </NavbarItem>
        )}

        {/* Admin (admin role only) */}
        {user?.role === 'admin' && (
          <NavbarItem>
            <Link href="/admin" color="foreground" className="font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t.admin || 'Админ'}
            </Link>
          </NavbarItem>
        )}

        {/* Help Button - Highlighted */}
        <NavbarItem>
          <Button
            as={Link}
            href="/help"
            color="warning"
            variant="flat"
            size="sm"
            startContent={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            className="font-medium"
          >
            {t.help || 'Помощь'}
          </Button>
        </NavbarItem>

        {/* Divider */}
        <div className="w-px h-6 bg-divider" />

        {/* Language Toggle */}
        <NavbarItem>
          <LanguageToggle />
        </NavbarItem>

        {/* Theme Toggle */}
        <NavbarItem>
          <ThemeToggle />
        </NavbarItem>

        {/* User Menu or Login Button */}
        {!isAuthenticated ? (
          <NavbarItem className="hidden lg:flex">
            <Button
              as={Link}
              color="primary"
              href="/login"
              variant="flat"
              size="sm"
              startContent={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              }
            >
              {t.login || 'Вход'}
            </Button>
          </NavbarItem>
        ) : (
          <NavbarItem>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <User
                  as="button"
                  name={user?.username || 'User'}
                  description={user?.email || ''}
                  className="transition-transform"
                  avatarProps={{
                    size: "sm",
                    showFallback: true,
                    name: user?.username?.[0]?.toUpperCase() || 'U'
                  }}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu actions">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{user?.email}</p>
                </DropdownItem>
                <DropdownItem
                  key="settings"
                  href="/profile"
                  startContent={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                >
                  Profile Settings
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  onPress={logout}
                  startContent={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  }
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        )}
      </NavbarContent>
    </Navbar>
  );
};
