'use client';

import { FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CreateProjectDialog } from './create-project-dialog';
import { Button } from '@/components/ui/button';

/**
 * Empty State Component for Projects
 */
export function ProjectEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-6 mb-4">
          <FolderOpen className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Get started by creating your first project to organize your pressure tests.
        </p>
        <CreateProjectDialog>
          <Button size="lg">Create Your First Project</Button>
        </CreateProjectDialog>
      </CardContent>
    </Card>
  );
}
