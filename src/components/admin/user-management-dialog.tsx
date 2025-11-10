/**
 * User Management Dialog Component
 *
 * Provides create and edit functionality for users in admin panel.
 * Uses shadcn/ui Dialog and Form components with Zod validation.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createUser, updateUser } from '@/lib/actions/admin';
import { Loader2Icon } from 'lucide-react';

// Form validation schema
// In edit mode, password is optional (empty string is allowed)
// In create mode, password is required and must be at least 8 characters
const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string(),
  role: z.enum(['admin', 'user']),
  organizationId: z.string().nullable().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserManagementDialogProps {
  /**
   * Trigger button content
   */
  trigger: React.ReactNode;

  /**
   * Mode: create or edit
   */
  mode: 'create' | 'edit';

  /**
   * User data for edit mode
   */
  user?: {
    id: string;
    name: string;
    email: string;
    username: string;
    role: 'admin' | 'user';
    organizationId?: string | null;
  };

  /**
   * Available organizations for selection
   */
  organizations?: Array<{ id: string; name: string }>;
}

export function UserManagementDialog({
  trigger,
  mode,
  user,
  organizations = [],
}: UserManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || '',
      password: '',
      role: user?.role || 'user',
      organizationId: user?.organizationId || undefined,
    },
  });

  async function onSubmit(values: UserFormValues) {
    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        // Create mode requires password with minimum 8 characters
        if (!values.password || values.password.length < 8) {
          toast({
            variant: 'destructive',
            title: t('toast.error'),
            description: t('user.passwordRequired'),
          });
          setIsSubmitting(false);
          return;
        }

        const result = await createUser({
          name: values.name,
          email: values.email,
          username: values.username,
          password: values.password,
          role: values.role,
          organizationId: values.organizationId || undefined,
        });

        if (result.success) {
          toast({
            title: t('toast.success'),
            description: t('user.userCreatedSuccess'),
          });
          setOpen(false);
          form.reset();
          router.refresh();
        } else {
          toast({
            variant: 'destructive',
            title: t('toast.error'),
            description: result.error || t('user.failedToCreateUser'),
          });
        }
      } else {
        // Edit mode
        if (!user?.id) {
          throw new Error(t('user.userIdRequired'));
        }

        const result = await updateUser(user.id, {
          name: values.name,
          email: values.email,
          username: values.username,
          role: values.role,
          organizationId: values.organizationId || null,
        });

        if (result.success) {
          toast({
            title: t('toast.success'),
            description: t('user.userUpdatedSuccess'),
          });
          setOpen(false);
          router.refresh();
        } else {
          toast({
            variant: 'destructive',
            title: t('toast.error'),
            description: result.error || t('user.failedToUpdateUser'),
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
            {mode === 'create' ? t('user.createNewUser') : t('user.editUser')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('user.addNewUserDescription')
              : t('user.updateUserInfo')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('user.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('user.email')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('user.username')}</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('user.usedForLogin')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'create' && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('user.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('user.minimumCharacters')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('user.role')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('user.selectARole')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">{t('user.userRole')}</SelectItem>
                      <SelectItem value="admin">{t('user.adminRole')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('user.adminFullAccess')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {organizations.length > 0 && (
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('user.organizationOptional')}</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // Convert "none" to null for the form value
                        field.onChange(value === 'none' ? null : value);
                      }}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('user.selectAnOrganization')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t('user.noOrganization')}</SelectItem>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                {mode === 'create' ? t('user.createUser') : t('user.updateUser')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
