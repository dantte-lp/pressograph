'use client';

/**
 * Project Card Component
 *
 * Displays a single project with actions (edit, archive, delete).
 */

import Link from 'next/link';
import { useState } from 'react';
import { MoreVertical, FolderOpen, Archive, Trash2, Edit, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { toggleArchiveProject, deleteProject } from '@/lib/actions/projects';
import { EditProjectDialog } from './edit-project-dialog';
import { DeleteProjectDialog } from './delete-project-dialog';
import type { Project } from '@/lib/db/schema/projects';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchiveToggle = async () => {
    setIsArchiving(true);
    try {
      const { error } = await toggleArchiveProject(project.id);

      if (error) {
        toast.error(error);
      } else {
        toast.success(
          project.isArchived ? 'Project unarchived successfully' : 'Project archived successfully'
        );
      }
    } catch (error) {
      toast.error('Failed to archive project');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <Link
              href={`/projects/${project.id}`}
              className="flex-1 min-w-0"
            >
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                <FolderOpen className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{project.name}</span>
              </CardTitle>
            </Link>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-2 flex-shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleArchiveToggle}
                  disabled={isArchiving}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {project.isArchived ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {project.description && (
            <CardDescription className="line-clamp-2 mt-2">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2">
            {project.isArchived && (
              <Badge variant="secondary">
                <Archive className="mr-1 h-3 w-3" />
                Archived
              </Badge>
            )}
            <Badge variant="outline">
              {project.settings.testNumberPrefix || 'PT'}
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* Edit Dialog */}
      <EditProjectDialog
        project={project}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      {/* Delete Dialog */}
      <DeleteProjectDialog
        project={project}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
