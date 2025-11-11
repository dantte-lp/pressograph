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
import { useTranslation } from '@/hooks/use-translation';

const createFormSchema = (t: (key: string) => string) => z.object({
  name: z
    .string()
    .min(1, t('projects.createDialog.nameRequired'))
    .max(255, t('projects.createDialog.nameTooLong')),
  description: z.string().optional(),
  autoNumberTests: z.boolean(),
  testNumberPrefix: z
    .string()
    .min(1, t('projects.createDialog.prefixRequired'))
    .max(10, t('projects.createDialog.prefixTooLong'))
    .regex(/^[A-Z0-9-]+$/, t('projects.createDialog.prefixInvalid')),
  requireNotes: z.boolean(),
});

interface CreateProjectDialogProps {
  children: React.ReactNode;
}

export function CreateProjectDialog({ children }: CreateProjectDialogProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = createFormSchema(t);
  type FormValues = z.infer<typeof formSchema>;

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
        toast.error(error || t('projects.createDialog.errorMessage'));
        return;
      }

      toast.success(t('projects.createDialog.successMessage'));
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error(t('projects.createDialog.unexpectedError'));
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
          <DialogTitle>{t('projects.createDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('projects.createDialog.description')}
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
                  <FormLabel>{t('projects.createDialog.nameLabel')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('projects.createDialog.namePlaceholder')} {...field} />
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
                  <FormLabel>{t('projects.createDialog.descriptionLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('projects.createDialog.descriptionPlaceholder')}
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
              <h4 className="text-sm font-medium">{t('projects.createDialog.settingsTitle')}</h4>

              {/* Auto-number Tests */}
              <FormField
                control={form.control}
                name="autoNumberTests"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>{t('projects.createDialog.autoNumberLabel')}</FormLabel>
                      <FormDescription className="text-xs">
                        {t('projects.createDialog.autoNumberDescription')}
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
                    <FormLabel>{t('projects.createDialog.prefixLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('projects.createDialog.prefixPlaceholder')} {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {t('projects.createDialog.prefixDescription')}
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
                      <FormLabel>{t('projects.createDialog.requireNotesLabel')}</FormLabel>
                      <FormDescription className="text-xs">
                        {t('projects.createDialog.requireNotesDescription')}
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
                {t('projects.createDialog.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('projects.createDialog.creating') : t('projects.createDialog.createButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
