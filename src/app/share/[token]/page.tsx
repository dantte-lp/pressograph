/**
 * Public Share Page
 *
 * Public access page for shared pressure test results.
 * No authentication required - access controlled by token.
 *
 * @route /share/[token]
 */

import { notFound } from 'next/navigation';
import { getShareLinkByToken } from '@/lib/actions/share-links';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DownloadIcon,
  CalendarIcon,
  UserIcon,
  FolderIcon,
  FlaskConicalIcon,
  EyeIcon,
  ClockIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { format } from 'date-fns';

export const metadata = {
  title: 'Shared Test | Pressograph',
  description: 'View shared pressure test results',
};

interface PageProps {
  params: {
    token: string;
  };
}

export default async function ShareLinkPage({ params }: PageProps) {
  const result = await getShareLinkByToken(params.token);

  if (!result.success || !result.shareLink) {
    notFound();
  }

  const { shareLink } = result;
  const { test } = shareLink;

  const isExpired = !!(shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date());

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <FlaskConicalIcon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Pressograph</h1>
                <p className="text-sm text-muted-foreground">Shared Pressure Test</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 lg:px-8 max-w-5xl space-y-6">
        {/* Share Info Banner */}
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <EyeIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">
                  {shareLink.title || 'Shared Pressure Test'}
                </h2>
                {shareLink.description && (
                  <p className="text-muted-foreground text-sm mb-3">{shareLink.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <EyeIcon className="h-4 w-4" />
                    <span>{shareLink.viewCount} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Shared {format(new Date(shareLink.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  {shareLink.expiresAt && (
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>
                        {isExpired ? 'Expired' : 'Expires'}{' '}
                        {format(new Date(shareLink.expiresAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{test.name || 'Unnamed Test'}</CardTitle>
                <CardDescription className="mt-1">
                  Test Number: {test.testNumber}
                </CardDescription>
              </div>
              <Badge
                variant={
                  test.status === 'completed'
                    ? 'default'
                    : test.status === 'running'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {test.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b">
              <div className="flex items-start gap-3">
                <FolderIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Project</div>
                  <div className="text-sm text-muted-foreground">
                    {test.project?.name || 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Created By</div>
                  <div className="text-sm text-muted-foreground">
                    {test.creator?.name || 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(test.createdAt), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Configuration */}
            {test.config && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Test Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.config.workingPressure && (
                    <div className="flex justify-between items-center border rounded-lg p-3">
                      <span className="text-sm text-muted-foreground">Working Pressure</span>
                      <span className="font-medium">
                        {test.config.workingPressure} {test.config.pressureUnit || 'MPa'}
                      </span>
                    </div>
                  )}
                  {test.config.maxPressure && (
                    <div className="flex justify-between items-center border rounded-lg p-3">
                      <span className="text-sm text-muted-foreground">Max Pressure</span>
                      <span className="font-medium">
                        {test.config.maxPressure} {test.config.pressureUnit || 'MPa'}
                      </span>
                    </div>
                  )}
                  {test.config.testDuration && (
                    <div className="flex justify-between items-center border rounded-lg p-3">
                      <span className="text-sm text-muted-foreground">Test Duration</span>
                      <span className="font-medium">{test.config.testDuration} hours</span>
                    </div>
                  )}
                  {test.config.temperature && (
                    <div className="flex justify-between items-center border rounded-lg p-3">
                      <span className="text-sm text-muted-foreground">Temperature</span>
                      <span className="font-medium">
                        {test.config.temperature}{' '}
                        {test.config.temperatureUnit === 'F' ? '°F' : '°C'}
                      </span>
                    </div>
                  )}
                  {test.config.allowablePressureDrop !== undefined && (
                    <div className="flex justify-between items-center border rounded-lg p-3">
                      <span className="text-sm text-muted-foreground">Allowable Pressure Drop</span>
                      <span className="font-medium">
                        {test.config.allowablePressureDrop} {test.config.pressureUnit || 'MPa'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Intermediate Stages */}
                {test.config.intermediateStages &&
                  Array.isArray(test.config.intermediateStages) &&
                  test.config.intermediateStages.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold mb-3">Intermediate Stages</h4>
                      <div className="space-y-2">
                        {test.config.intermediateStages.map((stage: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between border rounded-lg p-3"
                          >
                            <span className="text-sm font-medium">Stage {index + 1}</span>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                Time: {stage.time} min → Pressure: {stage.pressure}{' '}
                                {test.config.pressureUnit || 'MPa'}
                              </span>
                              {stage.holdDuration && (
                                <span>Hold: {stage.holdDuration} min</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Notes/Description */}
                {test.config.notes && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {test.config.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Download Section */}
            {shareLink.allowDownload && (
              <div className="pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-md font-semibold">Download Test Data</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Export test configuration and results
                    </p>
                  </div>
                  <Button variant="default" disabled={isExpired}>
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
              </div>
            )}

            {!shareLink.allowDownload && (
              <div className="pt-6 border-t">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <AlertCircleIcon className="h-5 w-5" />
                  <p className="text-sm">Downloads are not enabled for this shared link.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>
            This test was shared using{' '}
            <a
              href="https://github.com/dantte-lp/pressograph"
              className="font-medium hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pressograph
            </a>
          </p>
          <p className="mt-1">
            Pressure Test Graph Generation and Management System
          </p>
        </div>
      </div>
    </div>
  );
}
