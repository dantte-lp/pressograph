'use client';

import { Button } from '@/components/ui/button';
import { RefreshCwIcon } from 'lucide-react';

export function SystemComponentsRefreshButton() {
  return (
    <Button variant="outline" onClick={() => window.location.reload()}>
      <RefreshCwIcon className="h-4 w-4 mr-2" />
      Refresh
    </Button>
  );
}
