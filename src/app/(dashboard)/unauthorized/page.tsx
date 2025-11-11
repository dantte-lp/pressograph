/**
 * Unauthorized Access Page
 *
 * Displayed when a non-admin user attempts to access admin-only routes.
 *
 * @route /unauthorized
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlertIcon, HomeIcon, ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Unauthorized Access | Pressograph',
  description: 'You do not have permission to access this page',
};

export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlertIcon className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Unauthorized Access</CardTitle>
          <CardDescription className="text-base">
            You do not have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            This page is restricted to administrators only. If you believe you should have access,
            please contact your system administrator.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href={"/dashboard" as any}>
                <HomeIcon className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="#" onClick={() => window.history.back()}>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
