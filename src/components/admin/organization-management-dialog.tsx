/**
 * Organization Management Dialog Component
 *
 * Provides create and edit functionality for organizations in admin panel.
 * Uses shadcn/ui Dialog and Form components with Zod validation.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createOrganization, updateOrganization } from '@/lib/actions/admin';
import { Loader2Icon } from 'lucide-react';

// Form validation schema
const organizationFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #2563EB)')
    .optional(),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

interface OrganizationManagementDialogProps {
  /**
   * Trigger button content
   */
  trigger: React.ReactNode;

  /**
   * Mode: create or edit
   */
  mode: 'create' | 'edit';

  /**
   * Organization data for edit mode
   */
  organization?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
  };
}

export function OrganizationManagementDialog({
  trigger,
  mode,
  organization,
}: OrganizationManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: organization?.name || '',
      slug: organization?.slug || '',
      logoUrl: organization?.logoUrl || '',
      primaryColor: organization?.primaryColor || '#2563EB',
    },
  });

  // Auto-generate slug from name when creating
  const handleNameChange = (value: string) => {
    if (mode === 'create') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      form.setValue('slug', slug);
    }
  };

  async function onSubmit(values: OrganizationFormValues) {
    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const result = await createOrganization({
          name: values.name,
          slug: values.slug,
          logoUrl: values.logoUrl || undefined,
          primaryColor: values.primaryColor,
        });

        if (result.success) {
          toast({
            title: t('toast.success'),
            description: t('organization.organizationCreatedSuccess'),
          });
          setOpen(false);
          form.reset();
          router.refresh();
        } else {
          toast({
            variant: 'destructive',
            title: t('toast.error'),
            description: result.error || t('organization.failedToCreateOrganization'),
          });
        }
      } else {
        // Edit mode
        if (!organization?.id) {
          throw new Error(t('organization.organizationIdRequired'));
        }

        const result = await updateOrganization(organization.id, {
          name: values.name,
          slug: values.slug,
          logoUrl: values.logoUrl || null,
          primaryColor: values.primaryColor,
        });

        if (result.success) {
          toast({
            title: t('toast.success'),
            description: t('organization.organizationUpdatedSuccess'),
          });
          setOpen(false);
          router.refresh();
        } else {
          toast({
            variant: 'destructive',
            title: t('toast.error'),
            description: result.error || t('organization.failedToUpdateOrganization'),
          });
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: 'destructive',
        title: t('toast.error'),
        description: t('errors.unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('organization.createNewOrganization') : t('organization.editOrganization')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('organization.addNewOrgDescription')
              : t('organization.updateOrgInfo')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Corporation"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleNameChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.slug')}</FormLabel>
                  <FormControl>
                    <Input placeholder="acme-corporation" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('organization.slugUrlFriendly')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.logoUrlOptional')}</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('organization.urlToLogo')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.primaryColor')}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="#2563EB"
                        {...field}
                        className="flex-1"
                      />
                    </FormControl>
                    <Input
                      type="color"
                      value={field.value}
                      onChange={field.onChange}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormDescription>
                    {t('organization.brandColor')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === 'create' ? t('organization.createOrganization') : t('organization.updateOrganization')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
