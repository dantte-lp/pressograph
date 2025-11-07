'use client';

import { FolderOpen, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CreateProjectDialog } from './create-project-dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Empty State Component for Projects
 */
interface ProjectEmptyProps {
  isArchived?: boolean;
}

export function ProjectEmpty({ isArchived = false }: ProjectEmptyProps) {
  if (isArchived) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Archive className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No archived projects</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Projects you archive will appear here. You can restore them at any time.
          </p>
          <Button asChild size="lg">
            <Link href="/projects">View Active Projects</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

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
