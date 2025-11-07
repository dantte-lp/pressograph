import { Metadata } from 'next';
import { SignInForm } from '@/components/auth/signin-form';
import Link from 'next/link';
import { Suspense } from 'react';

/**
 * Sign In Page
 *
 * Provides authentication interface for users to sign in.
 * Features:
 * - Credentials-based authentication (username/password)
 * - Error handling with toast notifications
 * - Redirect to callback URL after successful sign in
 * - Clean, centered layout with branding
 */

export const metadata: Metadata = {
  title: 'Sign In | Pressograph',
  description: 'Sign in to your Pressograph account',
};

// Disable static generation for this page as it uses useSearchParams
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm flex-col justify-center space-y-6">
        {/* Logo and Branding */}
        <div className="flex flex-col space-y-2 text-center">
          <Link href="/" className="mx-auto mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Pressograph</h1>
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to sign in to your account
          </p>
        </div>

        {/* Sign In Form */}
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <SignInForm />
        </Suspense>

        {/* Footer Links */}
        <p className="px-8 text-center text-sm text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
