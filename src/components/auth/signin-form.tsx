'use client';

/**
 * Sign In Form Component
 *
 * Client-side form for credential-based authentication.
 * Features:
 * - Username and password input fields
 * - Form validation
 * - Error handling with toast notifications
 * - Loading state during authentication
 * - Redirect to callback URL after successful sign in
 */

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';

export function SignInForm() {
  const searchParams = useSearchParams();

  // Extract callback URL and strip localhost if present
  const getCallbackUrl = () => {
    const urlParam = searchParams.get('callbackUrl');
    if (!urlParam) return '/dashboard';

    // If it contains localhost, extract just the path
    if (urlParam.includes('localhost')) {
      try {
        const url = new URL(urlParam);
        return url.pathname + url.search + url.hash;
      } catch {
        return '/dashboard';
      }
    }

    // If it's a full URL with production domain, extract path
    try {
      const url = new URL(urlParam);
      // Only return the path part to prevent open redirects
      return url.pathname + url.search + url.hash;
    } catch {
      // It's already a relative path
      return urlParam;
    }
  };

  const callbackUrl = getCallbackUrl();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate form
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      // Attempt sign in with credentials
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        // Authentication failed
        setError('Invalid username or password');
        toast.error('Invalid username or password', {
          description: 'Please check your credentials and try again.',
        });
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Authentication successful
        toast.success('Signed in successfully', {
          description: 'Redirecting to your dashboard...',
        });

        // Redirect to callback URL
        // Use window.location for external or dynamic URLs
        window.location.href = callbackUrl;
      }
    } catch (error) {
      console.error('[Sign In Error]', error);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Sign in failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your username and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              disabled={loading}
              required
              autoComplete="username"
              className="w-full"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              disabled={loading}
              required
              autoComplete="current-password"
              className="w-full"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Test Credentials Hint (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-3 text-xs">
              <p className="font-medium mb-1">Test Credentials:</p>
              <p className="text-muted-foreground">
                Username: <code className="font-mono">testuser</code>
              </p>
              <p className="text-muted-foreground">
                Password: <code className="font-mono">Test1234!</code>
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
