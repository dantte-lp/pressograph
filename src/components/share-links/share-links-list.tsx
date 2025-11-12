'use client';

/**
 * Share Links List Component
 *
 * Display and manage share links for a pressure test:
 * - List all share links
 * - Copy link to clipboard
 * - Toggle active status
 * - Delete share links
 * - View analytics
 */

import { useState } from 'react';
import { getTestShareLinks, deleteShareLink, toggleShareLinkStatus } from '@/lib/actions/share-links';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ShareIcon,
  CopyIcon,
  MoreVerticalIcon,
  TrashIcon,
  PowerIcon,
  EyeIcon,
  CalendarIcon,
  DownloadIcon,
  ExternalLinkIcon,
  CheckIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface ShareLinksListProps {
  testId: string;
}

interface ShareLinkItem {
  id: string;
  token: string;
  title: string | null;
  description: string | null;
  url: string;
  expiresAt: Date | null;
  allowDownload: boolean;
  isActive: boolean;
  viewCount: number;
  lastViewedAt: Date | null;
  createdAt: Date;
  isExpired: boolean;
}

export function ShareLinksList({ testId }: ShareLinksListProps) {
  const [links, setLinks] = useState<ShareLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const result = await getTestShareLinks(testId);
      if (result.success && result.shareLinks) {
        setLinks(result.shareLinks);
      } else {
        toast.error(result.error || 'Failed to load share links');
      }
    } catch (error) {
      console.error('[ShareLinksList] Error:', error);
      toast.error('Failed to load share links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [testId]);

  const handleCopy = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (linkId: string) => {
    try {
      const result = await toggleShareLinkStatus(linkId);
      if (result.success) {
        toast.success(result.isActive ? 'Share link activated' : 'Share link deactivated');
        loadLinks();
      } else {
        toast.error(result.error || 'Failed to toggle share link status');
      }
    } catch (error) {
      console.error('[ShareLinksList] Toggle error:', error);
      toast.error('Failed to toggle share link status');
    }
  };

  const handleDelete = async () => {
    if (!linkToDelete) return;

    try {
      const result = await deleteShareLink(linkToDelete);
      if (result.success) {
        toast.success('Share link deleted');
        loadLinks();
      } else {
        toast.error(result.error || 'Failed to delete share link');
      }
    } catch (error) {
      console.error('[ShareLinksList] Delete error:', error);
      toast.error('Failed to delete share link');
    } finally {
      setDeleteDialogOpen(false);
      setLinkToDelete(null);
    }
  };

  const openDeleteDialog = (linkId: string) => {
    setLinkToDelete(linkId);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Share Links</CardTitle>
          <CardDescription>Loading share links...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (links.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Share Links</CardTitle>
          <CardDescription>No share links created yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <ShareIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Create a share link to allow public access to this test
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Share Links ({links.length})</CardTitle>
          <CardDescription>Manage public access links for this test</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-start justify-between border rounded-lg p-4 gap-4"
            >
              <div className="flex-1 space-y-2">
                {/* Title and Status */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium">
                    {link.title || 'Share Link'}
                  </h4>
                  {!link.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {link.isExpired && (
                    <Badge variant="destructive">Expired</Badge>
                  )}
                  {link.isActive && !link.isExpired && (
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  )}
                </div>

                {/* Description */}
                {link.description && (
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                )}

                {/* URL */}
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {link.url}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(link.url, link.id)}
                  >
                    {copiedId === link.id ? (
                      <CheckIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <EyeIcon className="h-3 w-3" />
                    <span>{link.viewCount} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>
                      Created {format(new Date(link.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {link.expiresAt && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>
                        {link.isExpired ? 'Expired' : 'Expires'}{' '}
                        {format(new Date(link.expiresAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  {link.allowDownload && (
                    <div className="flex items-center gap-1">
                      <DownloadIcon className="h-3 w-3" />
                      <span>Downloads enabled</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.open(link.url, '_blank')}>
                    <ExternalLinkIcon className="h-4 w-4 mr-2" />
                    Open Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopy(link.url, link.id)}>
                    <CopyIcon className="h-4 w-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleToggleStatus(link.id)}>
                    <PowerIcon className="h-4 w-4 mr-2" />
                    {link.isActive ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openDeleteDialog(link.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Share Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this share link. Anyone with the link will no longer be
              able to access the test. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
