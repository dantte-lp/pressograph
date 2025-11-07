'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusIcon, TrashIcon, SaveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateTest } from '@/lib/actions/tests';
import { PressureTestPreviewEnhanced } from './pressure-test-preview-enhanced';

// Validation schema for test form
const testSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
  templateType: z.enum(['daily', 'extended', 'custom']),
  workingPressure: z.number().min(0.1, 'Working pressure must be positive'),
  maxPressure: z.number().min(0.1, 'Max pressure must be positive'),
  testDuration: z.number().min(1, 'Duration must be at least 1 minute'),
  temperature: z.number().optional(),
  allowablePressureDrop: z.number().min(0, 'Allowable drop must be non-negative'),
  pressureUnit: z.enum(['MPa', 'Bar', 'PSI']),
  intermediateStages: z.array(
    z.object({
      duration: z.number().min(1, 'Duration must be positive'),
      targetPressure: z.number().min(0.1, 'Pressure must be positive'),
      holdDuration: z.number().min(0, 'Hold duration must be non-negative'),
    })
  ).optional(),
  tags: z.string().optional(),
});

type TestFormData = z.infer<typeof testSchema>;

interface EditTestFormClientProps {
  test: any;
}

export function EditTestFormClient({ test }: EditTestFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('basic');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    setValue,
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: test.name,
      description: test.description || '',
      projectId: test.projectId,
      templateType: test.templateType || 'custom',
      workingPressure: test.config.workingPressure,
      maxPressure: test.config.maxPressure,
      testDuration: test.config.testDuration,
      temperature: test.config.temperature,
      allowablePressureDrop: test.config.allowablePressureDrop,
      pressureUnit: test.config.pressureUnit || 'MPa',
      intermediateStages: test.config.intermediateStages || [],
      tags: test.tags?.join(', ') || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'intermediateStages',
  });

  // Watch form values for live preview
  const formValues = watch();

  const onSubmit = (data: TestFormData) => {
    startTransition(async () => {
      try {
        // Process tags
        const tags = data.tags
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [];

        // Prepare update payload
        const updatePayload = {
          name: data.name,
          description: data.description,
          projectId: data.projectId,
          templateType: data.templateType,
          config: {
            workingPressure: data.workingPressure,
            maxPressure: data.maxPressure,
            testDuration: data.testDuration,
            temperature: data.temperature,
            allowablePressureDrop: data.allowablePressureDrop,
            pressureUnit: data.pressureUnit,
            intermediateStages: data.intermediateStages || [],
          },
          tags,
        };

        const result = await updateTest(test.id, updatePayload);

        if (result.success) {
          toast.success('Test updated successfully');
          router.push(`/tests/${test.id}`);
          router.refresh();
        } else {
          toast.error(result.error || 'Failed to update test');
        }
      } catch (error) {
        console.error('Error updating test:', error);
        toast.error('An unexpected error occurred');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4 mt-6">
          {/* Test Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Test Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Daily Pressure Test - Pipeline A"
              aria-invalid={!!errors.name}
            />
            {errors.name && <FormError message={errors.name.message} />}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Optional description of the test purpose..."
              rows={4}
            />
            {errors.description && <FormError message={errors.description.message} />}
          </div>

          {/* Template Type */}
          <div className="space-y-2">
            <Label htmlFor="templateType">Template Type</Label>
            <Select
              value={formValues.templateType}
              onValueChange={(value) => setValue('templateType', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily (24 hours)</SelectItem>
                <SelectItem value="extended">Extended (48-72 hours)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="e.g., pipeline, commissioning, critical"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>
        </TabsContent>

        {/* Parameters Tab */}
        <TabsContent value="parameters" className="space-y-6 mt-6">
          {/* Pressure Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pressure Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Working Pressure */}
                <div className="space-y-2">
                  <Label htmlFor="workingPressure">Working Pressure *</Label>
                  <Input
                    id="workingPressure"
                    type="number"
                    step="0.1"
                    {...register('workingPressure', { valueAsNumber: true })}
                    aria-invalid={!!errors.workingPressure}
                  />
                  {errors.workingPressure && (
                    <FormError message={errors.workingPressure.message} />
                  )}
                </div>

                {/* Max Pressure */}
                <div className="space-y-2">
                  <Label htmlFor="maxPressure">Maximum Pressure *</Label>
                  <Input
                    id="maxPressure"
                    type="number"
                    step="0.1"
                    {...register('maxPressure', { valueAsNumber: true })}
                    aria-invalid={!!errors.maxPressure}
                  />
                  {errors.maxPressure && <FormError message={errors.maxPressure.message} />}
                </div>

                {/* Allowable Pressure Drop */}
                <div className="space-y-2">
                  <Label htmlFor="allowablePressureDrop">Allowable Pressure Drop *</Label>
                  <Input
                    id="allowablePressureDrop"
                    type="number"
                    step="0.01"
                    {...register('allowablePressureDrop', { valueAsNumber: true })}
                    aria-invalid={!!errors.allowablePressureDrop}
                  />
                  {errors.allowablePressureDrop && (
                    <FormError message={errors.allowablePressureDrop.message} />
                  )}
                </div>

                {/* Pressure Unit */}
                <div className="space-y-2">
                  <Label htmlFor="pressureUnit">Pressure Unit</Label>
                  <Select
                    value={formValues.pressureUnit}
                    onValueChange={(value) => setValue('pressureUnit', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MPa">MPa</SelectItem>
                      <SelectItem value="Bar">Bar</SelectItem>
                      <SelectItem value="PSI">PSI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duration and Temperature */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Duration & Environment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Test Duration */}
                <div className="space-y-2">
                  <Label htmlFor="testDuration">Test Duration (minutes) *</Label>
                  <Input
                    id="testDuration"
                    type="number"
                    step="1"
                    {...register('testDuration', { valueAsNumber: true })}
                    aria-invalid={!!errors.testDuration}
                  />
                  {errors.testDuration && <FormError message={errors.testDuration.message} />}
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    {...register('temperature', { valueAsNumber: true })}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intermediate Stages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Intermediate Stages</CardTitle>
              <CardDescription>
                Optional pressure stages before reaching working pressure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-4 md:grid-cols-4 items-end p-4 border rounded-lg"
                >
                  <div className="space-y-2">
                    <Label htmlFor={`intermediateStages.${index}.duration`}>
                      Duration (min)
                    </Label>
                    <Input
                      type="number"
                      step="1"
                      {...register(`intermediateStages.${index}.duration` as const, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`intermediateStages.${index}.targetPressure`}>
                      Target Pressure
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      {...register(`intermediateStages.${index}.targetPressure` as const, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`intermediateStages.${index}.holdDuration`}>
                      Hold (min)
                    </Label>
                    <Input
                      type="number"
                      step="1"
                      {...register(`intermediateStages.${index}.holdDuration` as const, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ duration: 60, targetPressure: 5, holdDuration: 30 })
                }
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Stage
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Graph Preview</CardTitle>
              <CardDescription>
                Visual representation of the test configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PressureTestPreviewEnhanced
                workingPressure={formValues.workingPressure || 0}
                maxPressure={formValues.maxPressure || 0}
                testDuration={formValues.testDuration || 0}
                intermediateStages={formValues.intermediateStages || []}
                pressureUnit={formValues.pressureUnit || 'MPa'}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          <SaveIcon className="mr-2 h-4 w-4" />
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
