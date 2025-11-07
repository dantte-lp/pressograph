'use client';

/**
 * Create Project Dialog Component
 *
 * Modal form for creating a new project.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { createProject } from '@/lib/actions/projects';

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name is too long'),
  description: z.string().optional(),
  autoNumberTests: z.boolean(),
  testNumberPrefix: z
    .string()
    .min(1, 'Prefix is required')
    .max(10, 'Prefix is too long')
    .regex(/^[A-Z0-9-]+$/, 'Prefix must contain only uppercase letters, numbers, and hyphens'),
  requireNotes: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProjectDialogProps {
  children: React.ReactNode;
}

export function CreateProjectDialog({ children }: CreateProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      autoNumberTests: true,
      testNumberPrefix: '',
      requireNotes: false,
    },
  });

  // Generate unique prefix when dialog opens
  useEffect(() => {
    if (open && !form.getValues('testNumberPrefix')) {
      const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
      form.setValue('testNumberPrefix', `PT-${timestamp}`);
    }
  }, [open, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      const { project, error } = await createProject({
        name: values.name,
        description: values.description,
        settings: {
          autoNumberTests: values.autoNumberTests,
          testNumberPrefix: values.testNumberPrefix,
          requireNotes: values.requireNotes,
          defaultTemplateType: 'daily',
        },
      });

      if (error || !project) {
        toast.error(error || 'Failed to create project');
        return;
      }

      toast.success('Project created successfully');
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('[CreateProjectDialog] Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a project to organize your pressure tests.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the project..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Settings Section */}
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="text-sm font-medium">Project Settings</h4>

              {/* Auto-number Tests */}
              <FormField
                control={form.control}
                name="autoNumberTests"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-number Tests</FormLabel>
                      <FormDescription className="text-xs">
                        Automatically assign sequential numbers to tests
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Test Number Prefix */}
              <FormField
                control={form.control}
                name="testNumberPrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Number Prefix</FormLabel>
                    <FormControl>
                      <Input placeholder="PT" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Prefix for test numbers (e.g., PT-001, PT-002)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Require Notes */}
              <FormField
                control={form.control}
                name="requireNotes"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Require Notes</FormLabel>
                      <FormDescription className="text-xs">
                        Require notes when creating tests
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
