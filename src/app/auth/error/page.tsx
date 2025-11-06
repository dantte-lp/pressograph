import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * Authentication Error Page
 *
 * Displays authentication errors with user-friendly messages.
 * Provides options to retry or return to home page.
 */

export const metadata: Metadata = {
  title: 'Authentication Error | Pressograph',
  description: 'An error occurred during authentication',
};

interface ErrorPageProps {
  searchParams: {
    error?: string;
  };
}

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Configuration Error',
    description:
      'There is a problem with the server configuration. Please contact support.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description:
      'You do not have permission to sign in. Please contact your administrator.',
  },
  Verification: {
    title: 'Verification Failed',
    description:
      'The verification link has expired or has already been used. Please request a new one.',
  },
  OAuthSignin: {
    title: 'OAuth Sign In Error',
    description:
      'An error occurred while trying to sign in with the OAuth provider.',
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description:
      'An error occurred during the OAuth callback. Please try again.',
  },
  OAuthCreateAccount: {
    title: 'OAuth Account Creation Error',
    description:
      'Could not create an account with the OAuth provider. Please try again.',
  },
  EmailCreateAccount: {
    title: 'Email Account Creation Error',
    description:
      'Could not create an account with the provided email. Please try again.',
  },
  Callback: {
    title: 'Callback Error',
    description: 'An error occurred during the authentication callback.',
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    description:
      'This OAuth account is not linked to any existing account. Please sign in with your original method first.',
  },
  EmailSignin: {
    title: 'Email Sign In Error',
    description:
      'The verification link is invalid or has expired. Please request a new one.',
  },
  CredentialsSignin: {
    title: 'Invalid Credentials',
    description: 'The username or password you entered is incorrect.',
  },
  SessionRequired: {
    title: 'Session Required',
    description:
      'You must be signed in to access this page. Please sign in and try again.',
  },
  Default: {
    title: 'Authentication Error',
    description:
      'An unexpected error occurred during authentication. Please try again.',
  },
};

export default function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const errorType = searchParams.error || 'Default';
  const errorInfo = errorMessages[errorType] || errorMessages.Default;

  return (
    <div className="container relative flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[500px]">
        {/* Logo and Branding */}
        <div className="flex flex-col space-y-2 text-center">
          <Link href="/" className="mx-auto mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Pressograph</h1>
          </Link>
        </div>

        {/* Error Card */}
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">
                {errorInfo.title}
              </CardTitle>
            </div>
            <CardDescription>{errorInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/auth/signin">Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground">
          If you continue to experience issues, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}
