import Link from 'next/link';
import { AlertCircleIcon, ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestNotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center p-6 lg:p-8">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="h-5 w-5 text-destructive" />
            <CardTitle>Test Not Found</CardTitle>
          </div>
          <CardDescription>
            The pressure test you're looking for doesn't exist or you don't have access to it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This could happen if:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>The test was deleted</li>
            <li>You don't have permission to view this test</li>
            <li>The test ID in the URL is incorrect</li>
          </ul>
          <div className="flex gap-2 pt-4">
            <Button asChild>
              <Link href="/tests">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Tests
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
