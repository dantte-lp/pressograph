'use client';

/**
 * Update Notification Badge Component
 *
 * Displays a notification badge in the header when system updates are available.
 * Only visible to admin users.
 *
 * Features:
 * - Fetches update status on mount
 * - Shows badge with count of outdated packages
 * - Links to the components page
 * - Auto-refreshes periodically
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PackageIcon } from 'lucide-react';
import { checkForUpdates } from '@/lib/actions/admin';

export function UpdateNotificationBadge() {
  const { data: session } = useSession();
  const [updateStatus, setUpdateStatus] = useState<{
    hasUpdates: boolean;
    outdatedCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Only show for admin users
  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    // Fetch update status
    const fetchUpdateStatus = async () => {
      try {
        const status = await checkForUpdates();
        setUpdateStatus(status);
      } catch (error) {
        console.error('[UpdateNotificationBadge] Failed to fetch update status:', error);
        setUpdateStatus({ hasUpdates: false, outdatedCount: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchUpdateStatus();

    // Refresh every 5 minutes
    const interval = setInterval(fetchUpdateStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Don't render if not admin or no updates
  if (!isAdmin || loading || !updateStatus || !updateStatus.hasUpdates) {
    return null;
  }

  return (
    <Link
      href={"/admin/system/components" as any}
      prefetch={false}
      className="relative inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-10 w-10"
      title={`${updateStatus.outdatedCount} package update${updateStatus.outdatedCount !== 1 ? 's' : ''} available`}
    >
      <PackageIcon className="h-5 w-5" />
      <Badge
        variant="destructive"
        className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-xs flex items-center justify-center"
      >
        {updateStatus.outdatedCount}
      </Badge>
    </Link>
  );
}
