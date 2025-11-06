'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ToastDemo() {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Toast Notifications Demo</h2>
      <p className="mb-6 text-muted-foreground">
        Click the buttons below to see different types of toast notifications
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Button
          onClick={() =>
            toast.success('Success!', {
              description: 'Your action completed successfully',
            })
          }
          variant="default"
        >
          Success Toast
        </Button>
        <Button
          onClick={() =>
            toast.error('Error!', {
              description: 'Something went wrong. Please try again.',
            })
          }
          variant="destructive"
        >
          Error Toast
        </Button>
        <Button
          onClick={() =>
            toast.warning('Warning!', {
              description: 'This action may have consequences',
            })
          }
          variant="outline"
        >
          Warning Toast
        </Button>
        <Button
          onClick={() =>
            toast.info('Information', {
              description: 'Here is some useful information for you',
            })
          }
          variant="secondary"
        >
          Info Toast
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Button
          onClick={() => {
            toast.promise(
              new Promise((resolve) => setTimeout(resolve, 2000)),
              {
                loading: 'Loading data...',
                success: 'Data loaded successfully!',
                error: 'Failed to load data',
              }
            );
          }}
          variant="outline"
        >
          Promise Toast
        </Button>
        <Button
          onClick={() => {
            toast('Custom Toast', {
              description: 'This is a custom toast with an action',
              action: {
                label: 'Undo',
                onClick: () => toast.info('Undo clicked!'),
              },
            });
          }}
          variant="outline"
        >
          Toast with Action
        </Button>
      </div>

      <div className="mt-6">
        <Button
          onClick={() => {
            toast.success('Profile updated!');
            toast.info('New feature available!');
            toast.warning('Storage almost full');
          }}
          variant="outline"
          className="w-full"
        >
          Multiple Toasts
        </Button>
      </div>
    </Card>
  );
}
