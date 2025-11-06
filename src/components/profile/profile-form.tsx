'use client';

/**
 * Profile Form Component
 *
 * Allows users to update their profile information:
 * - Name
 * - Email
 *
 * Features:
 * - Client-side validation
 * - Loading states
 * - Toast notifications
 * - Error handling
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface ProfileFormProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
    username: string;
    role: string;
    createdAt: Date;
    lastLoginAt?: Date | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Name is too long (max 255 characters)';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    } else if (formData.email.length > 255) {
      newErrors.email = 'Email is too long (max 255 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isChanged =
    formData.name !== (user.name || '') || formData.email !== user.email;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username (read-only) */}
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={user.username}
            disabled
            className="bg-muted cursor-not-allowed"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Username cannot be changed
          </p>
        </div>

        {/* Name */}
        <div>
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) {
                setErrors({ ...errors, name: '' });
              }
            }}
            placeholder="Enter your name"
            disabled={loading}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-destructive mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) {
                setErrors({ ...errors, email: '' });
              }
            }}
            placeholder="Enter your email"
            disabled={loading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Role (read-only) */}
        <div>
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={user.role}
            disabled
            className="bg-muted cursor-not-allowed capitalize"
          />
        </div>

        {/* Account Information */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account created:</span>
            <span className="font-medium">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
          {user.lastLoginAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last login:</span>
              <span className="font-medium">
                {new Date(user.lastLoginAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button type="submit" disabled={loading || !isChanged}>
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
