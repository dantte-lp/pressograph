'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, CheckCircle2Icon, AlertCircleIcon, Loader2Icon } from 'lucide-react';
import { syncPackageVersions, type SyncResult } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Package Sync Button Component
 *
 * Triggers background sync of npm package versions to database.
 * Shows progress and results in a modal dialog.
 */
export function PackageSyncButton() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setShowResult(false);

    try {
      const result = await syncPackageVersions();
      setSyncResult(result);
      setShowResult(true);

      // Refresh the page data if sync was successful
      if (result.success) {
        router.refresh();
      }
    } catch (error) {
      console.error('[PackageSyncButton] Sync error:', error);
      setSyncResult({
        success: false,
        packagesProcessed: 0,
        packagesUpdated: 0,
        packagesCreated: 0,
        errors: 1,
        duration: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      setShowResult(true);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <Button
        variant="default"
        onClick={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <>
            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Sync Now
          </>
        )}
      </Button>

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {syncResult?.success ? (
                <>
                  <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                  Sync Completed
                </>
              ) : (
                <>
                  <AlertCircleIcon className="h-5 w-5 text-destructive" />
                  Sync Failed
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {syncResult?.success
                ? 'Package versions have been updated from npm registry'
                : 'An error occurred while syncing package versions'}
            </DialogDescription>
          </DialogHeader>

          {syncResult && (
            <div className="space-y-3">
              {/* Success Stats */}
              {syncResult.success && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-muted-foreground text-xs mb-1">Processed</div>
                    <div className="text-lg font-semibold">{syncResult.packagesProcessed}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-muted-foreground text-xs mb-1">Duration</div>
                    <div className="text-lg font-semibold">
                      {(syncResult.duration / 1000).toFixed(1)}s
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                    <div className="text-muted-foreground text-xs mb-1">Created</div>
                    <div className="text-lg font-semibold text-green-600">
                      {syncResult.packagesCreated}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                    <div className="text-muted-foreground text-xs mb-1">Updated</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {syncResult.packagesUpdated}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Stats */}
              {syncResult.errors > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                    <AlertCircleIcon className="h-4 w-4" />
                    <span>{syncResult.errors} package{syncResult.errors !== 1 ? 's' : ''} failed to sync</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {syncResult.error && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                  <div className="text-sm text-destructive font-medium mb-1">Error</div>
                  <div className="text-sm text-muted-foreground">{syncResult.error}</div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-muted-foreground text-center pt-2">
                Synced at {syncResult.timestamp.toLocaleTimeString()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResult(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
