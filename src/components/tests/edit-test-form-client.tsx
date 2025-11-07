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
import { PressureTestPreview } from './pressure-test-preview';
import { PreviewDialog } from './preview-dialog';

// Validation schema for test form (matches create form schema)
const intermediateStageSchema = z.object({
  time: z.number().min(0, 'Time must be positive'), // Minutes after previous stage
  pressure: z.number().min(0, 'Pressure must be positive'), // Target pressure
  duration: z.number().min(0, 'Duration must be positive'), // Hold duration in minutes
});

const testSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
  templateType: z.enum(['daily', 'extended', 'custom']),
  workingPressure: z.number().min(0.1, 'Working pressure must be positive'),
  maxPressure: z.number().min(0.1, 'Max pressure must be positive'),
  testDuration: z.number().min(0.1, 'Duration must be at least 0.1 hours'),
  temperature: z.number(),
  allowablePressureDrop: z.number().min(0, 'Allowable drop must be non-negative'),
  pressureUnit: z.enum(['MPa', 'Bar', 'PSI']),
  temperatureUnit: z.enum(['C', 'F']).default('C'),
  equipmentId: z.string().optional(),
  operatorName: z.string().optional(),
  notes: z.string().optional(),
  startDateTime: z.string().optional(),
  endDateTime: z.string().optional(),
  intermediateStages: z.array(intermediateStageSchema).default([]),
  tags: z.string().optional(),
}).refine(
  (data) => {
    return data.intermediateStages.every(
      (stage) => stage.pressure >= data.workingPressure
    );
  },
  {
    message: 'Intermediate stage pressure cannot be below working pressure',
    path: ['intermediateStages'],
  }
);

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
    trigger,
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: test.name,
      description: test.description || '',
      projectId: test.projectId,
      templateType: test.templateType || 'custom',
      workingPressure: test.config.workingPressure,
      maxPressure: test.config.maxPressure,
      testDuration: test.config.testDuration, // Keep in hours (not minutes)
      temperature: test.config.temperature || 20,
      allowablePressureDrop: test.config.allowablePressureDrop,
      pressureUnit: test.config.pressureUnit || 'MPa',
      temperatureUnit: test.config.temperatureUnit || 'C',
      equipmentId: test.config.equipmentId || '',
      operatorName: test.config.operatorName || '',
      notes: test.config.notes || '',
      startDateTime: test.config.startDateTime || '',
      endDateTime: test.config.endDateTime || '',
      // Keep database structure as-is (no transformation needed)
      // Database: { time, pressure, duration }
      // Form: { time, pressure, duration }
      intermediateStages: (test.config.intermediateStages || []).map((stage: any) => ({
        time: stage.time || 0,
        pressure: stage.pressure || 0,
        duration: stage.duration || 0,
      })),
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

        // Prepare update payload (no transformation needed - form matches DB structure)
        const updatePayload = {
          name: data.name,
          description: data.description,
          projectId: data.projectId,
          templateType: data.templateType,
          config: {
            workingPressure: data.workingPressure,
            maxPressure: data.maxPressure,
            testDuration: data.testDuration, // Already in hours
            temperature: data.temperature,
            allowablePressureDrop: data.allowablePressureDrop,
            pressureUnit: data.pressureUnit,
            temperatureUnit: data.temperatureUnit,
            equipmentId: data.equipmentId,
            operatorName: data.operatorName,
            notes: data.notes,
            startDateTime: data.startDateTime || undefined,
            endDateTime: data.endDateTime || undefined,
            intermediateStages: data.intermediateStages, // Already in correct format
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="stages">Stages</TabsTrigger>
          <TabsTrigger value="preview">Graph Preview</TabsTrigger>
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
            {errors.name && <FormError error={errors.name.message} />}
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
            {errors.description && <FormError error={errors.description.message} />}
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

        {/* Parameters Tab - Made More Compact with Preview */}
        <TabsContent value="parameters" className="space-y-4 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column: Parameters */}
            <div className="space-y-4">
              {/* Pressure Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Pressure Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
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
                    <FormError error={errors.workingPressure.message} />
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
                  {errors.maxPressure && <FormError error={errors.maxPressure.message} />}
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
                    <FormError error={errors.allowablePressureDrop.message} />
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
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Duration & Temperature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                {/* Test Duration */}
                <div className="space-y-2">
                  <Label htmlFor="testDuration">Test Duration (hours) *</Label>
                  <Input
                    id="testDuration"
                    type="number"
                    step="0.1"
                    {...register('testDuration', { valueAsNumber: true })}
                    aria-invalid={!!errors.testDuration}
                  />
                  {errors.testDuration && <FormError error={errors.testDuration.message} />}
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      {...register('temperature', { valueAsNumber: true })}
                      aria-invalid={!!errors.temperature}
                    />
                    <Select
                      value={formValues.temperatureUnit || 'C'}
                      onValueChange={(value) => setValue('temperatureUnit', value as any)}
                    >
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="C">°C</SelectItem>
                        <SelectItem value="F">°F</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.temperature && <FormError error={errors.temperature.message} />}
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Test Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Test Schedule (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDateTime">Start Date & Time</Label>
                    <Input
                      id="startDateTime"
                      type="datetime-local"
                      {...register('startDateTime')}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      When the test should begin
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDateTime">End Date & Time</Label>
                    <Input
                      id="endDateTime"
                      type="datetime-local"
                      {...register('endDateTime')}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      When the test should end
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment and Operator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Equipment & Operator (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="equipmentId">Equipment ID</Label>
                    <Input
                      id="equipmentId"
                      placeholder="e.g., PUMP-001"
                      {...register('equipmentId')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operatorName">Operator Name</Label>
                    <Input
                      id="operatorName"
                      placeholder="e.g., John Doe"
                      {...register('operatorName')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes"
                    rows={3}
                    {...register('notes')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Graph Preview */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Live Preview</CardTitle>
                    <CardDescription className="text-xs">
                      Real-time visualization of test configuration
                    </CardDescription>
                  </div>
                  <PreviewDialog
                    workingPressure={formValues.workingPressure ?? 10}
                    maxPressure={formValues.maxPressure ?? 15}
                    testDuration={formValues.testDuration ?? 24}
                    intermediateStages={formValues.intermediateStages ?? []}
                    pressureUnit={formValues.pressureUnit ?? 'MPa'}
                    startDateTime={formValues.startDateTime}
                    endDateTime={formValues.endDateTime}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <PressureTestPreview
                  workingPressure={formValues.workingPressure ?? 10}
                  maxPressure={formValues.maxPressure ?? 15}
                  testDuration={formValues.testDuration ?? 24}
                  intermediateStages={formValues.intermediateStages ?? []}
                  pressureUnit={formValues.pressureUnit ?? 'MPa'}
                  startDateTime={formValues.startDateTime || undefined}
                  endDateTime={formValues.endDateTime || undefined}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        </TabsContent>

        {/* Stages Tab - Moved from Parameters */}
        <TabsContent value="stages" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Intermediate Stages</CardTitle>
              <CardDescription>
                Add optional pressure steps during the test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No intermediate stages added yet.</p>
                  <p className="text-sm mt-1">Click "Add Stage" to create pressure steps.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-lg">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">#</th>
                          <th className="px-3 py-2 text-left font-medium" title="Minutes AFTER previous stage's hold duration ends">
                            Time (min)
                          </th>
                          <th className="px-3 py-2 text-left font-medium">Pressure ({formValues.pressureUnit ?? 'MPa'})</th>
                          <th className="px-3 py-2 text-left font-medium">Hold (min)</th>
                          <th className="px-3 py-2 text-center font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, index) => (
                          <tr key={field.id} className="border-t hover:bg-muted/30">
                            <td className="px-3 py-2 font-medium">{index + 1}</td>
                            <td className="px-3 py-1.5">
                              <Input
                                type="number"
                                step="1"
                                placeholder="0"
                                className="h-8 w-20 text-xs"
                                {...register(`intermediateStages.${index}.time` as const, {
                                  valueAsNumber: true,
                                })}
                                title="Minutes AFTER previous stage's hold duration ends"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                className="h-8 w-20 text-xs"
                                {...register(`intermediateStages.${index}.pressure` as const, {
                                  valueAsNumber: true,
                                })}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                type="number"
                                step="1"
                                placeholder="0"
                                className="h-8 w-20 text-xs"
                                {...register(`intermediateStages.${index}.duration` as const, {
                                  valueAsNumber: true,
                                })}
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="h-7 w-7 p-0"
                              >
                                <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded">
                    <span>Total Stages: {fields.length}</span>
                  </div>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ time: 0, pressure: 0, duration: 0 })
                }
                className="w-full"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Stage
              </Button>

              {errors.intermediateStages && (
                <FormError error={errors.intermediateStages.message || 'Invalid intermediate stages configuration'} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab - IDENTICAL to create page preview */}
        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Graph Preview</CardTitle>
                  <CardDescription>
                    Real-time pressure profile visualization
                  </CardDescription>
                </div>
                <PreviewDialog
                  workingPressure={formValues.workingPressure ?? 10}
                  maxPressure={formValues.maxPressure ?? 15}
                  testDuration={formValues.testDuration ?? 24}
                  intermediateStages={formValues.intermediateStages ?? []}
                  pressureUnit={formValues.pressureUnit ?? 'MPa'}
                  startDateTime={formValues.startDateTime}
                  endDateTime={formValues.endDateTime}
                />
              </div>
            </CardHeader>
            <CardContent>
              <PressureTestPreview
                workingPressure={formValues.workingPressure ?? 10}
                maxPressure={formValues.maxPressure ?? 15}
                testDuration={formValues.testDuration ?? 24}
                intermediateStages={formValues.intermediateStages ?? []}
                pressureUnit={formValues.pressureUnit ?? 'MPa'}
                startDateTime={formValues.startDateTime || undefined}
                endDateTime={formValues.endDateTime || undefined}
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
