'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  CheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  PlusIcon,
  TrashIcon,
  SaveIcon,
  PlayIcon,
} from 'lucide-react';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useFormCache } from '@/lib/hooks/use-form-cache';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormError } from '@/components/ui/form-error';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PressureTestPreview } from '@/components/tests/pressure-test-preview';
import { PreviewDialog } from '@/components/tests/preview-dialog';
import { ImportConfigButton } from '@/components/tests/import-config-button';
import { createTest } from '@/lib/actions/tests';
import type { TestDetail } from '@/lib/actions/tests';
import type { Project } from '@/lib/db/schema/projects';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';

/**
 * Form validation schema
 */
const intermediateStageSchema = z.object({
  time: z.number().min(0, 'Time must be positive'), // MINUTES AFTER previous stage's hold ends (relative time)
  pressure: z.number().min(0, 'Pressure must be positive'), // Target pressure in configured unit (MPa/Bar/PSI)
  duration: z.number().min(0, 'Duration must be positive'), // Hold duration in MINUTES
});

const testFormSchema = z.object({
  // Step 1: Basic Information
  name: z.string().min(1, 'Test name is required').max(255, 'Name too long'),
  projectId: z.string().uuid('Please select a project'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),

  // Step 2: Core Parameters
  workingPressure: z.number().min(0, 'Working pressure must be positive'),
  maxPressure: z.number().min(0, 'Max pressure must be positive'),
  testDuration: z.number().min(0.1, 'Duration must be at least 0.1 hours'),
  temperature: z.number(),
  allowablePressureDrop: z.number().min(0, 'Allowable drop must be positive'),
  pressureUnit: z.enum(['MPa', 'Bar', 'PSI']).default('MPa'),
  temperatureUnit: z.enum(['C', 'F']).default('C'),
  equipmentId: z.string().optional(),
  operatorName: z.string().optional(),
  notes: z.string().optional(),

  // Test schedule
  startDateTime: z.string().optional(),
  endDateTime: z.string().optional(),

  // Step 3: Intermediate Stages
  intermediateStages: z.array(intermediateStageSchema).default([]),

  // Template
  templateType: z.enum(['daily', 'extended', 'custom']).default('custom'),
}).refine(
  (data) => {
    // Validate that all intermediate stage pressures are >= working pressure
    return data.intermediateStages.every(
      (stage) => stage.pressure >= data.workingPressure
    );
  },
  {
    message: 'Intermediate stage pressure cannot be below working pressure',
    path: ['intermediateStages'],
  }
);

type TestFormData = z.infer<typeof testFormSchema>;

interface CreateTestFormProps {
  projects: Project[];
  sourceTest: TestDetail | null;
  userId: string;
  organizationId: string;
}

const STEPS = [
  { id: 1, name: 'Basic Information', description: 'Name, project, and description' },
  { id: 2, name: 'Core Parameters', description: 'Pressure, temperature, and duration' },
  { id: 3, name: 'Intermediate Stages', description: 'Optional pressure steps (optional)' },
  { id: 4, name: 'Review & Create', description: 'Review and submit' },
];

export function CreateTestForm({ projects, sourceTest, userId, organizationId }: CreateTestFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [tagInput, setTagInput] = useState('');

  // Initialize form with source test data if duplicating
  const defaultValues: Partial<TestFormData> = sourceTest
    ? {
        name: `${sourceTest.name} (Copy)`,
        projectId: sourceTest.projectId,
        description: sourceTest.description || '',
        tags: sourceTest.tags || [],
        workingPressure: sourceTest.config.workingPressure,
        maxPressure: sourceTest.config.maxPressure,
        testDuration: sourceTest.config.testDuration,
        temperature: sourceTest.config.temperature,
        allowablePressureDrop: sourceTest.config.allowablePressureDrop,
        pressureUnit: sourceTest.config.pressureUnit || 'MPa',
        temperatureUnit: sourceTest.config.temperatureUnit || 'C',
        equipmentId: sourceTest.config.equipmentId || '',
        operatorName: sourceTest.config.operatorName || '',
        notes: sourceTest.config.notes || '',
        intermediateStages: sourceTest.config.intermediateStages || [],
        templateType: (sourceTest.templateType as 'daily' | 'extended' | 'custom') || 'custom',
      }
    : {
        name: '',
        projectId: '',
        description: '',
        workingPressure: 10,
        maxPressure: 15,
        testDuration: 24,
        temperature: 20,
        allowablePressureDrop: 0.5,
        pressureUnit: 'MPa' as const,
        temperatureUnit: 'C' as const,
        equipmentId: '',
        operatorName: '',
        notes: '',
        startDateTime: '',
        endDateTime: '',
        intermediateStages: [],
        templateType: 'daily' as const,
        tags: [],
      };

  const form = useForm<TestFormData>({
    resolver: zodResolver(testFormSchema) as any,
    defaultValues,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = form;

  const watchedStages = watch('intermediateStages') || [];
  const watchedTags = watch('tags') || [];

  // Three-tier caching: Tier 2 (LocalStorage)
  const { clearCache } = useFormCache({
    key: 'pressograph-test-form-draft',
    form,
    autosaveInterval: 30000, // Auto-save every 30 seconds
    enabled: !sourceTest, // Disable cache when duplicating existing test
  });

  // Watch form values for graph preview
  const workingPressure = watch('workingPressure');
  const maxPressure = watch('maxPressure');
  const testDuration = watch('testDuration');
  const pressureUnit = watch('pressureUnit') || 'MPa';
  const temperatureUnit = watch('temperatureUnit') || 'C';

  // Debounce graph updates for better performance (300ms delay)
  // Use nullish coalescing (??) to allow 0 values while providing defaults for undefined/null
  const debouncedWorkingPressure = useDebounce(workingPressure ?? 10, 300);
  const debouncedMaxPressure = useDebounce(maxPressure ?? 15, 300);
  const debouncedTestDuration = useDebounce(testDuration ?? 24, 300);
  const debouncedStages = useDebounce(watchedStages, 300);

  // Add tag
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !watchedTags.includes(trimmed)) {
      setValue('tags', [...watchedTags, trimmed]);
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setValue(
      'tags',
      watchedTags.filter((t) => t !== tag)
    );
  };

  // Add intermediate stage with empty/default values
  const handleAddStage = () => {
    setValue('intermediateStages', [
      ...watchedStages,
      { time: 0, pressure: 0, duration: 0 }, // Start with zeros, not hardcoded values
    ]);
  };

  // Remove intermediate stage
  const handleRemoveStage = (index: number) => {
    setValue(
      'intermediateStages',
      watchedStages.filter((_, i) => i !== index),
      { shouldValidate: true, shouldDirty: true, shouldTouch: true }
    );
  };

  // Update intermediate stage field
  const handleUpdateStageField = (index: number, field: 'time' | 'pressure' | 'duration', value: number) => {
    const updatedStages = watchedStages.map((stage, i) =>
      i === index ? { ...stage, [field]: value } : stage
    );
    setValue('intermediateStages', updatedStages, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  // Calculate end date/time based on start date/time and duration
  const calculateEndDateTime = (startDateTime: string, durationHours: number): string => {
    if (!startDateTime || !durationHours) return '';
    try {
      const start = new Date(startDateTime);
      const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
      // Return in ISO format compatible with datetime-local input
      const year = end.getFullYear();
      const month = String(end.getMonth() + 1).padStart(2, '0');
      const day = String(end.getDate()).padStart(2, '0');
      const hours = String(end.getHours()).padStart(2, '0');
      const minutes = String(end.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Handle imported configuration
  const handleImportConfig = (config: Partial<PressureTestConfig>) => {
    // Update form fields with imported values
    if (config.workingPressure !== undefined) setValue('workingPressure', config.workingPressure);
    if (config.maxPressure !== undefined) setValue('maxPressure', config.maxPressure);
    if (config.testDuration !== undefined) setValue('testDuration', config.testDuration);
    if (config.temperature !== undefined) setValue('temperature', config.temperature);
    if (config.allowablePressureDrop !== undefined) setValue('allowablePressureDrop', config.allowablePressureDrop);
    if (config.pressureUnit) setValue('pressureUnit', config.pressureUnit);
    if (config.temperatureUnit) setValue('temperatureUnit', config.temperatureUnit);
    if (config.equipmentId) setValue('equipmentId', config.equipmentId);
    if (config.operatorName) setValue('operatorName', config.operatorName);
    if (config.notes) setValue('notes', config.notes);
    if (config.startDateTime) setValue('startDateTime', config.startDateTime);
    if (config.endDateTime) setValue('endDateTime', config.endDateTime);
    if (config.intermediateStages) setValue('intermediateStages', config.intermediateStages);
  };

  // Watch for changes in start date/time or duration to auto-calculate end date/time
  const startDateTime = watch('startDateTime');
  const watchedDuration = watch('testDuration');

  // Auto-update end date/time when start or duration changes
  const handleStartDateTimeChange = (value: string) => {
    setValue('startDateTime', value);
    if (value && watchedDuration) {
      const calculatedEnd = calculateEndDateTime(value, watchedDuration);
      setValue('endDateTime', calculatedEnd);
    }
  };

  const handleDurationChange = (value: number) => {
    setValue('testDuration', value, { valueAsNumber: true } as any);
    if (startDateTime && value) {
      const calculatedEnd = calculateEndDateTime(startDateTime, value);
      setValue('endDateTime', calculatedEnd);
    }
  };

  // Navigate between steps
  const handleNext = async () => {
    let fieldsToValidate: (keyof TestFormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ['name', 'projectId', 'description', 'tags'];
    } else if (currentStep === 2) {
      fieldsToValidate = [
        'workingPressure',
        'maxPressure',
        'testDuration',
        'temperature',
        'allowablePressureDrop',
        'pressureUnit',
        'temperatureUnit',
      ];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit form
  const onSubmit = async (data: any, saveAsDraft: boolean = false) => {
    startTransition(async () => {
      try {
        const result = await createTest({
          name: data.name,
          projectId: data.projectId,
          description: data.description || null,
          tags: data.tags,
          templateType: data.templateType,
          config: {
            workingPressure: data.workingPressure,
            maxPressure: data.maxPressure,
            testDuration: data.testDuration,
            temperature: data.temperature,
            allowablePressureDrop: data.allowablePressureDrop,
            pressureUnit: data.pressureUnit,
            temperatureUnit: data.temperatureUnit,
            intermediateStages: data.intermediateStages,
            notes: data.notes,
            equipmentId: data.equipmentId,
            operatorName: data.operatorName,
            startDateTime: data.startDateTime || undefined,
            endDateTime: data.endDateTime || undefined,
          },
          status: saveAsDraft ? 'draft' : 'ready',
          userId,
          organizationId,
        });

        if (result.success && result.test) {
          // Clear cache on successful submission (Tier 3: Database now has data)
          clearCache();
          toast.success(saveAsDraft ? 'Test saved as draft' : 'Test created successfully');
          router.push(`/tests/${result.test.id}`);
        } else {
          toast.error(result.error || 'Failed to create test');
        }
      } catch (error) {
        console.error('Error creating test:', error);
        toast.error('An unexpected error occurred');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Step Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {STEPS.map((step, stepIdx) => (
                <li key={step.id} className="relative flex-1">
                  {stepIdx !== 0 && (
                    <div
                      className="absolute left-0 top-5 -ml-px h-0.5 w-full"
                      style={{ left: 'calc(-50% + 20px)', width: 'calc(100% - 40px)' }}
                    >
                      <div
                        className={`h-full ${
                          currentStep > step.id ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    </div>
                  )}
                  <div className="group relative flex flex-col items-center">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        currentStep > step.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : currentStep === step.id
                          ? 'border-primary bg-background text-primary'
                          : 'border-muted bg-background text-muted-foreground'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckIcon className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </span>
                    <span className="mt-2 text-center">
                      <span
                        className={`block text-sm font-medium ${
                          currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {step.name}
                      </span>
                      <span className="hidden text-xs text-muted-foreground sm:block">
                        {step.description}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Form {...form}>
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide a name, select a project, and add optional details
                </CardDescription>
              </div>
              <ImportConfigButton onImport={handleImportConfig} size="sm" />
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Test Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Daily Pressure Test - Pipeline A"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Project <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description of the test"
                  rows={4}
                  {...register('description')}
                />
                {errors.description && <FormError error={errors.description.message} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {watchedTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateType">Template Type</Label>
                <Controller
                  name="templateType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || 'daily'}>
                      <SelectTrigger id="templateType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Test</SelectItem>
                        <SelectItem value="extended">Extended Test</SelectItem>
                        <SelectItem value="custom">Custom Test</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" asChild>
                <a href="/tests">Cancel</a>
              </Button>
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Core Parameters */}
        {currentStep === 2 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Core Parameters</CardTitle>
                <CardDescription>
                  Configure pressure, temperature, and duration settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={control}
                  name="workingPressure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Working Pressure <span className="text-destructive">*</span>
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormField
                          control={control}
                          name="pressureUnit"
                          render={({ field: unitField }) => (
                            <FormItem>
                              <Select onValueChange={unitField.onChange} value={unitField.value || 'MPa'}>
                                <FormControl>
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="MPa">MPa</SelectItem>
                                  <SelectItem value="Bar">Bar</SelectItem>
                                  <SelectItem value="PSI">PSI</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="maxPressure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Max Pressure <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label htmlFor="testDuration">
                    Test Duration (hours) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="testDuration"
                    type="number"
                    step="0.1"
                    value={watchedDuration || 0}
                    onChange={(e) => handleDurationChange(parseFloat(e.target.value) || 0)}
                    aria-invalid={!!errors.testDuration}
                  />
                  {errors.testDuration && <FormError error={errors.testDuration.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">
                    Temperature <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      {...register('temperature', { valueAsNumber: true })}
                      aria-invalid={!!errors.temperature}
                    />
                    <Controller
                      name="temperatureUnit"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || 'C'}>
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="C">°C</SelectItem>
                            <SelectItem value="F">°F</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {errors.temperature && <FormError error={errors.temperature.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowablePressureDrop">
                    Allowable Pressure Drop <span className="text-destructive">*</span>
                  </Label>
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
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Test Schedule (Optional)</h4>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDateTime">Start Date & Time</Label>
                    <Input
                      id="startDateTime"
                      type="datetime-local"
                      value={startDateTime || ''}
                      onChange={(e) => handleStartDateTimeChange(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      When the test should begin
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDateTime">End Date & Time (Auto-calculated)</Label>
                    <Input
                      id="endDateTime"
                      type="datetime-local"
                      {...register('endDateTime')}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Calculated from start + duration, or set manually
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="equipmentId">Equipment ID</Label>
                  <Input id="equipmentId" placeholder="e.g., PUMP-001" {...register('equipmentId')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operatorName">Operator Name</Label>
                  <Input id="operatorName" placeholder="e.g., John Doe" {...register('operatorName')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Additional notes" rows={3} {...register('notes')} />
              </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrev}>
                  <ChevronLeftIcon className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button type="button" onClick={handleNext}>
                  Next
                  <ChevronRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Graph Preview */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      Real-time pressure profile visualization
                    </CardDescription>
                  </div>
                  <PreviewDialog
                    workingPressure={debouncedWorkingPressure}
                    maxPressure={debouncedMaxPressure}
                    testDuration={debouncedTestDuration}
                    intermediateStages={debouncedStages}
                    pressureUnit={pressureUnit}
                    temperatureUnit={temperatureUnit}
                    startDateTime={startDateTime}
                    endDateTime={watch('endDateTime')}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <PressureTestPreview
                  workingPressure={debouncedWorkingPressure}
                  maxPressure={debouncedMaxPressure}
                  testDuration={debouncedTestDuration}
                  intermediateStages={debouncedStages}
                  pressureUnit={pressureUnit}
                  startDateTime={startDateTime || undefined}
                  endDateTime={watch('endDateTime') || undefined}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Intermediate Stages */}
        {currentStep === 3 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Intermediate Stages</CardTitle>
                <CardDescription>
                  Add optional pressure steps during the test (you can skip this step)
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              {watchedStages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No intermediate stages added yet.</p>
                  <p className="text-sm mt-1">Click "Add Stage" to create pressure steps.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Compact table view */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-lg">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">#</th>
                          <th className="px-3 py-2 text-left font-medium" title="Minutes AFTER previous stage's hold duration ends">
                            Time (min)
                          </th>
                          <th className="px-3 py-2 text-left font-medium" title="Cumulative time from test start">
                            Cumulative
                          </th>
                          <th className="px-3 py-2 text-left font-medium">Pressure ({pressureUnit})</th>
                          <th className="px-3 py-2 text-left font-medium">Hold (min)</th>
                          <th className="px-3 py-2 text-center font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {watchedStages.map((_stage, index) => {
                          const stagePressure = watchedStages[index]?.pressure || 0;
                          const isPressureBelowWorking = stagePressure > 0 && stagePressure < workingPressure;

                          // Calculate cumulative time for this stage
                          let cumulativeMinutes = 0;
                          for (let i = 0; i <= index; i++) {
                            cumulativeMinutes += watchedStages[i]?.time || 0; // Wait time after previous stage
                            if (i < index) {
                              cumulativeMinutes += watchedStages[i]?.duration || 0; // Hold duration
                            }
                          }

                          // Format cumulative time as H:M
                          const hours = Math.floor(cumulativeMinutes / 60);
                          const mins = Math.round(cumulativeMinutes % 60);
                          const cumulativeDisplay = hours > 0
                            ? `${hours}:${mins.toString().padStart(2, '0')}`
                            : `${mins}m`;

                          return (
                            <tr key={index} className="border-t hover:bg-muted/30">
                              <td className="px-3 py-2 font-medium">{index + 1}</td>
                              <td className="px-3 py-1.5">
                                <Input
                                  type="number"
                                  step="1"
                                  placeholder="0"
                                  className="h-8 w-20 text-xs"
                                  value={watchedStages[index]?.time || 0}
                                  onChange={(e) => handleUpdateStageField(index, 'time', parseFloat(e.target.value) || 0)}
                                  title="Minutes AFTER previous stage's hold duration ends"
                                />
                              </td>
                              <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                                {cumulativeDisplay}
                              </td>
                              <td className="px-3 py-1.5">
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="0.0"
                                  className={`h-8 w-20 text-xs ${isPressureBelowWorking ? 'border-destructive focus:ring-destructive' : ''}`}
                                  value={watchedStages[index]?.pressure || 0}
                                  onChange={(e) => handleUpdateStageField(index, 'pressure', parseFloat(e.target.value) || 0)}
                                  title={isPressureBelowWorking ? `Pressure must be >= ${workingPressure} ${pressureUnit}` : ''}
                                  aria-invalid={isPressureBelowWorking}
                                />
                              </td>
                              <td className="px-3 py-1.5">
                                <Input
                                  type="number"
                                  step="1"
                                  placeholder="0"
                                  className="h-8 w-20 text-xs"
                                  value={watchedStages[index]?.duration || 0}
                                  onChange={(e) => handleUpdateStageField(index, 'duration', parseFloat(e.target.value) || 0)}
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveStage(index)}
                                  className="h-7 w-7 p-0"
                                >
                                  <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded">
                    <span>Total Stages: {watchedStages.length}</span>
                  </div>
                </div>
              )}

              <Button type="button" variant="outline" onClick={handleAddStage} className="w-full">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Stage
              </Button>

              {/* Display intermediate stages validation error */}
              {errors.intermediateStages && (
                <FormError error={errors.intermediateStages.message || 'Invalid intermediate stages configuration'} />
              )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrev}>
                  <ChevronLeftIcon className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button type="button" onClick={handleNext}>
                  Next
                  <ChevronRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Graph Preview */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      See how intermediate stages affect the pressure profile
                    </CardDescription>
                  </div>
                  <PreviewDialog
                    workingPressure={debouncedWorkingPressure}
                    maxPressure={debouncedMaxPressure}
                    testDuration={debouncedTestDuration}
                    intermediateStages={debouncedStages}
                    pressureUnit={pressureUnit}
                    temperatureUnit={temperatureUnit}
                    startDateTime={startDateTime}
                    endDateTime={watch('endDateTime')}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <PressureTestPreview
                  workingPressure={debouncedWorkingPressure}
                  maxPressure={debouncedMaxPressure}
                  testDuration={debouncedTestDuration}
                  intermediateStages={debouncedStages}
                  pressureUnit={pressureUnit}
                  startDateTime={startDateTime || undefined}
                  endDateTime={watch('endDateTime') || undefined}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Review & Create */}
        {currentStep === 4 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Review & Create</CardTitle>
                <CardDescription>Review your test configuration and submit</CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info Review */}
              <div>
                <h3 className="font-medium mb-2">Basic Information</h3>
                <dl className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Name:</dt>
                    <dd className="font-medium">{watch('name')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Project:</dt>
                    <dd className="font-medium">
                      {projects.find((p) => p.id === watch('projectId'))?.name}
                    </dd>
                  </div>
                  {watch('description') && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Description:</dt>
                      <dd className="font-medium">{watch('description')}</dd>
                    </div>
                  )}
                  {watchedTags.length > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tags:</dt>
                      <dd className="flex gap-1">
                        {watchedTags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <Separator />

              {/* Core Parameters Review */}
              <div>
                <h3 className="font-medium mb-2">Core Parameters</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Working Pressure:</dt>
                    <dd className="font-medium">
                      {watch('workingPressure')} {watch('pressureUnit')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Max Pressure:</dt>
                    <dd className="font-medium">
                      {watch('maxPressure')} {watch('pressureUnit')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Duration:</dt>
                    <dd className="font-medium">{watch('testDuration')} hours</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Temperature:</dt>
                    <dd className="font-medium">
                      {watch('temperature')}°{watch('temperatureUnit')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Allowable Drop:</dt>
                    <dd className="font-medium">
                      {watch('allowablePressureDrop')} {watch('pressureUnit')}
                    </dd>
                  </div>
                </dl>
              </div>

              {watchedStages.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Intermediate Stages</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {watchedStages.length} stage{watchedStages.length !== 1 ? 's' : ''} configured
                    </p>
                  </div>
                </>
              )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrev}>
                  <ChevronLeftIcon className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSubmit((data) => onSubmit(data, true))()}
                    disabled={isPending}
                  >
                    <SaveIcon className="mr-2 h-4 w-4" />
                    Save as Draft
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    <PlayIcon className="mr-2 h-4 w-4" />
                    {isPending ? 'Creating...' : 'Create Test'}
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* Graph Preview */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Final Preview</CardTitle>
                    <CardDescription>
                      Complete pressure test profile
                    </CardDescription>
                  </div>
                  <PreviewDialog
                    workingPressure={debouncedWorkingPressure}
                    maxPressure={debouncedMaxPressure}
                    testDuration={debouncedTestDuration}
                    intermediateStages={debouncedStages}
                    pressureUnit={pressureUnit}
                    temperatureUnit={temperatureUnit}
                    startDateTime={startDateTime}
                    endDateTime={watch('endDateTime')}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <PressureTestPreview
                  workingPressure={debouncedWorkingPressure}
                  maxPressure={debouncedMaxPressure}
                  testDuration={debouncedTestDuration}
                  intermediateStages={debouncedStages}
                  pressureUnit={pressureUnit}
                  startDateTime={startDateTime || undefined}
                  endDateTime={watch('endDateTime') || undefined}
                />
              </CardContent>
            </Card>
          </div>
        )}
        </form>
      </Form>
    </div>
  );
}
