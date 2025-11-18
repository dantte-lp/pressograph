'use client';

/**
 * Project Settings Form Component
 *
 * Allows users to edit project settings including:
 * - Project name and description
 * - Test numbering configuration
 * - Test requirements
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import { updateProject } from '@/lib/actions/projects';
import type { Project } from '@/lib/db/schema/projects';
import { useTranslation } from '@/hooks/use-translation';
import { SaveIcon, LoaderIcon } from 'lucide-react';

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

interface ProjectSettingsFormProps {
  project: Project;
}

export function ProjectSettingsForm({ project }: ProjectSettingsFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      autoNumberTests: project.settings?.autoNumberTests ?? true,
      testNumberPrefix: project.settings?.testNumberPrefix ?? 'PT',
      requireNotes: project.settings?.requireNotes ?? false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      const { error } = await updateProject(project.id, {
        name: values.name,
        description: values.description,
        settings: {
          autoNumberTests: values.autoNumberTests,
          testNumberPrefix: values.testNumberPrefix,
          requireNotes: values.requireNotes,
          defaultTemplateType: project.settings?.defaultTemplateType ?? 'pdf',
        },
      });

      if (error) {
        toast.error(error);
        setIsSubmitting(false);
        return;
      }

      toast.success(t('projects.settingsSaved'));
      router.refresh();
    } catch (error) {
      console.error('Error updating project settings:', error);
      toast.error(t('projects.settingsSaveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Project Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('projects.name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('projects.namePlaceholder')} {...field} />
              </FormControl>
              <FormDescription>
                {t('projects.nameDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Project Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('projects.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('projects.descriptionPlaceholder')}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t('projects.descriptionDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Auto Number Tests */}
        <FormField
          control={form.control}
          name="autoNumberTests"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t('projects.autoNumberTests')}
                </FormLabel>
                <FormDescription>
                  {t('projects.autoNumberTestsDescription')}
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
              <FormLabel>{t('projects.testNumberPrefix')}</FormLabel>
              <FormControl>
                <Input
                  placeholder="PT"
                  maxLength={10}
                  className="max-w-xs uppercase"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormDescription>
                {t('projects.testNumberPrefixDescription')}
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t('projects.requireNotes')}
                </FormLabel>
                <FormDescription>
                  {t('projects.requireNotesDescription')}
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

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                {t('common.save')}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
