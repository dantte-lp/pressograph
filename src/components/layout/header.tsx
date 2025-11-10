'use client';

/**
 * Application Header Component
 *
 * Features:
 * - Logo and branding
 * - Navigation menu (only for authenticated users)
 * - User authentication menu
 * - Theme toggle
 * - Responsive mobile menu
 *
 * Authentication-based rendering:
 * - Unauthenticated: Logo, Theme Toggle, Sign In button
 * - Authenticated: Logo, Navigation (Projects/Tests/Dashboard), Theme Toggle, User Menu, Sign Out
 */

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export function Header() {
  const { data: session, status } = useSession({
    required: false,
  });
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isAuthenticated = !!session;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">Pressograph</span>
        </Link>

        {/* Desktop Navigation - Only for authenticated users */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/projects"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Projects
            </Link>
            <Link
              href="/tests"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Tests
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
          </nav>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
              )}
            </button>
          )}

          {/* Auth Menu */}
          {status === 'loading' ? (
            <div className="h-10 w-20 animate-pulse rounded-md bg-muted" />
          ) : session ? (
            <>
              {/* User name - desktop only */}
              <span className="hidden lg:inline-block text-sm font-medium text-muted-foreground">
                {session.user?.name || session.user?.email}
              </span>
              {/* Sign Out button */}
              <button
                onClick={async () => {
                  console.log('[Header] Sign out initiated');
                  console.log('[Header] window.location.origin:', window.location.origin);
                  console.log('[Header] window.location.href:', window.location.href);

                  try {
                    // Prevent NextAuth from handling redirect
                    await signOut({ redirect: false });
                    console.log('[Header] NextAuth signOut complete');

                    // Force absolute URL redirect
                    const targetUrl = 'https://dev-pressograph.infra4.dev/';
                    console.log('[Header] Redirecting to:', targetUrl);

                    // Use window.location.replace to prevent back button issues
                    window.location.replace(targetUrl);
                  } catch (error) {
                    console.error('[Header] Sign out error:', error);
                    // Fallback: still try to redirect
                    window.location.replace('https://dev-pressograph.infra4.dev/');
                  }
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin?callbackUrl=/dashboard"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Button - Only for authenticated users */}
          {isAuthenticated && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu - Only for authenticated users */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto flex flex-col gap-3 px-4 py-4">
            <Link
              href="/projects"
              className="text-sm font-medium transition-colors hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Projects
            </Link>
            <Link
              href="/tests"
              className="text-sm font-medium transition-colors hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tests
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium transition-colors hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
