'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Spinner,
  LoadingOverlay,
  InlineLoader,
  ButtonLoader,
} from '@/components/ui/spinner';
import {
  CardSkeleton,
  TableSkeleton,
  FormSkeleton,
  TextSkeleton,
  StatsCardSkeleton,
  AvatarSkeleton,
  ListItemSkeleton,
} from '@/components/ui/loading-skeletons';

export function LoadingDemo() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleButtonClick = async () => {
    setButtonLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setButtonLoading(false);
  };

  const handleOverlayClick = async () => {
    setShowOverlay(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setShowOverlay(false);
  };

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="mb-4 text-2xl font-bold">Loading States Demo</h2>
        <p className="mb-6 text-muted-foreground">
          Various loading indicators and skeleton components
        </p>

        {/* Spinners */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Spinners</h3>
          <div className="flex flex-wrap items-center gap-8">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Small</p>
              <Spinner size="sm" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Medium</p>
              <Spinner size="md" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Large</p>
              <Spinner size="lg" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Extra Large</p>
              <Spinner size="xl" />
            </div>
          </div>
        </div>

        {/* Inline Loader */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Inline Loaders</h3>
          <div className="space-y-4">
            <InlineLoader text="Loading data..." />
            <InlineLoader text="Processing request..." size="md" />
          </div>
        </div>

        {/* Loading Overlay */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Loading Overlay</h3>
          <div className="relative">
            <Button onClick={handleOverlayClick}>Show Loading Overlay</Button>
            {showOverlay && (
              <div className="relative mt-4 h-48 rounded-lg border">
                <LoadingOverlay message="Loading content..." />
              </div>
            )}
          </div>
        </div>

        {/* Button Loading */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Button Loading State</h3>
          <Button onClick={handleButtonClick} disabled={buttonLoading}>
            {buttonLoading ? (
              <>
                <ButtonLoader />
                <span className="ml-2">Loading...</span>
              </>
            ) : (
              'Click to Load'
            )}
          </Button>
        </div>
      </Card>

      {/* Skeleton Components */}
      <Card className="p-6">
        <h2 className="mb-6 text-2xl font-bold">Skeleton Loaders</h2>

        <div className="space-y-8">
          {/* Card Skeleton */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Card Skeleton</h3>
            <CardSkeleton />
          </div>

          {/* Stats Card Skeleton */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Stats Card Skeleton</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </div>
          </div>

          {/* Text Skeleton */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Text Skeleton</h3>
            <TextSkeleton lines={5} />
          </div>

          {/* Avatar Skeleton */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Avatar Skeleton</h3>
            <div className="flex gap-4">
              <AvatarSkeleton size="sm" />
              <AvatarSkeleton size="md" />
              <AvatarSkeleton size="lg" />
            </div>
          </div>

          {/* List Item Skeleton */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">List Item Skeleton</h3>
            <div className="space-y-2">
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
            </div>
          </div>

          {/* Table Skeleton */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Table Skeleton</h3>
            <TableSkeleton rows={3} columns={4} />
          </div>

          {/* Form Skeleton */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Form Skeleton</h3>
            <FormSkeleton fields={3} />
          </div>
        </div>
      </Card>
    </div>
  );
}
