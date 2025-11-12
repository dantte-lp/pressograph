'use client';

/**
 * Create Share Link Dialog
 *
 * Dialog for creating new share links with configurable options:
 * - Expiration date
 * - Download permissions
 * - Title and description
 */

import { useState } from 'react';
import { createShareLink } from '@/lib/actions/share-links';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShareIcon, CopyIcon, CheckIcon, ExternalLinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface CreateShareLinkDialogProps {
  testId: string;
  testName?: string;
  trigger?: React.ReactNode;
}

export function CreateShareLinkDialog({
  testId,
  testName,
  trigger,
}: CreateShareLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('7');
  const [allowDownload, setAllowDownload] = useState(true);

  const handleCreate = async () => {
    setLoading(true);

    try {
      const result = await createShareLink({
        pressureTestId: testId,
        expiresInDays: expiresIn === 'never' ? null : parseInt(expiresIn),
        allowDownload,
        title: title || undefined,
        description: description || undefined,
      });

      if (result.success && result.shareLink) {
        setCreatedLink(result.shareLink.url);
        toast.success('Share link created successfully!');
      } else {
        toast.error(result.error || 'Failed to create share link');
      }
    } catch (error) {
      console.error('[CreateShareLinkDialog] Error:', error);
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (createdLink) {
      await navigator.clipboard.writeText(createdLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form after close animation
    setTimeout(() => {
      setTitle('');
      setDescription('');
      setExpiresIn('7');
      setAllowDownload(true);
      setCreatedLink(null);
      setCopied(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ShareIcon className="h-4 w-4 mr-2" />
            Create Share Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        {!createdLink ? (
          <>
            <DialogHeader>
              <DialogTitle>Create Share Link</DialogTitle>
              <DialogDescription>
                Generate a public link to share this test: {testName || testId}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="e.g., Q4 Pipeline Test Results"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description for this shared link..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label htmlFor="expires">Link Expiration</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger id="expires">
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="never">Never expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allow Download */}
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="download" className="flex flex-col space-y-1">
                  <span>Allow Download</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Viewers can download test data
                  </span>
                </Label>
                <Switch
                  id="download"
                  checked={allowDownload}
                  onCheckedChange={setAllowDownload}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Create Link'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Share Link Created!</DialogTitle>
              <DialogDescription>
                Your share link is ready. Copy and share it with anyone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Generated Link */}
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex items-center gap-2">
                  <Input value={createdLink} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expiration Info */}
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">Link Details:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    • Expires:{' '}
                    {expiresIn === 'never'
                      ? 'Never'
                      : `in ${expiresIn} day${parseInt(expiresIn) > 1 ? 's' : ''}`}
                  </li>
                  <li>• Downloads: {allowDownload ? 'Enabled' : 'Disabled'}</li>
                  {title && <li>• Title: {title}</li>}
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => window.open(createdLink, '_blank')}>
                <ExternalLinkIcon className="h-4 w-4 mr-2" />
                Open Link
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
