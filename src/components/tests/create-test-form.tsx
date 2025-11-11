'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  PlusIcon,
  TrashIcon,
  SaveIcon,
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
import { TemplateSelector } from '@/components/tests/template-selector';
import { SaveAsTemplateButton } from '@/components/tests/save-as-template-button';
import { createTest } from '@/lib/actions/tests';
import type { TestDetail } from '@/lib/actions/tests';
import type { Project } from '@/lib/db/schema/projects';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';

/**
 * Form validation schema factory - creates schema with translated error messages
 */
const createValidationSchema = (t: (key: string) => string) => {
  const intermediateStageSchema = z.object({
    time: z.number().min(0, t('tests.create.intermediateStages.validation.time')),
    pressure: z.number().min(0, t('tests.create.intermediateStages.validation.pressure')),
    duration: z.number().min(0, t('tests.create.intermediateStages.validation.duration')),
  });

  return z.object({
    // Basic Information
    name: z.string().min(1, t('tests.create.fields.testName.required')).max(255, t('tests.create.fields.testName.tooLong')),
    projectId: z.string().uuid(t('tests.create.fields.project.required')),
    testNumber: z.string().min(3, t('tests.create.fields.testNumber.minLength')).max(100, t('tests.create.fields.testNumber.tooLong')).optional().or(z.literal('')),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),

    // Core Parameters
    workingPressure: z.number().min(0, t('tests.create.fields.workingPressure.required')),
    maxPressure: z.number().min(0, t('tests.create.fields.maxPressure.required')),
    testDuration: z.number().min(0.1, t('tests.create.fields.testDuration.required')),
    temperature: z.number(),
    allowablePressureDrop: z.number().min(0, t('tests.create.fields.allowablePressureDrop.required')),
    pressureUnit: z.enum(['MPa', 'Bar', 'PSI']).default('MPa'),
    temperatureUnit: z.enum(['C', 'F']).default('C'),
    equipmentId: z.string().optional(),
    operatorName: z.string().optional(),
    notes: z.string().optional(),

    // Test schedule
    startDateTime: z.string().optional(),
    endDateTime: z.string().optional(),

    // Intermediate Stages
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
      message: t('tests.create.intermediateStages.validation.belowWorking'),
      path: ['intermediateStages'],
    }
  );
};

type TestFormData = z.infer<ReturnType<typeof createValidationSchema>>;

interface CreateTestFormProps {
  projects: Project[];
  sourceTest: TestDetail | null;
  userId: string;
  organizationId: string;
}

export function CreateTestForm({ projects, sourceTest, userId, organizationId }: CreateTestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();

  // Initialize form with source test data if duplicating
  const defaultValues: Partial<TestFormData> = sourceTest
    ? {
        name: t('tests.create.messages.copyName', { name: sourceTest.name }),
        projectId: sourceTest.projectId,
        testNumber: '', // Don't copy test number (must be unique)
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
        testNumber: '',
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
    resolver: zodResolver(createValidationSchema(t)) as any,
    defaultValues,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
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
  const startDateTime = watch('startDateTime');

  // Debounce graph updates for better performance (300ms delay)
  const debouncedWorkingPressure = useDebounce(workingPressure ?? 10, 300);
  const debouncedMaxPressure = useDebounce(maxPressure ?? 15, 300);
  const debouncedTestDuration = useDebounce(testDuration ?? 24, 300);
  const debouncedStages = useDebounce(watchedStages, 300);

  // Add tag
  const [tagInput, setTagInput] = useState('');
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !watchedTags.includes(trimmed)) {
      setValue('tags', [...watchedTags, trimmed]);
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setValue('tags', watchedTags.filter((t) => t !== tag));
  };

  // Add intermediate stage
  const handleAddStage = () => {
    setValue('intermediateStages', [
      ...watchedStages,
      { time: 0, pressure: 0, duration: 0 },
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

  // Handle Cancel button click
  const handleCancel = () => {
    // Check if there are unsaved changes
    if (isDirty) {
      const confirmed = window.confirm(t('tests.create.messages.unsavedChanges'));

      if (!confirmed) {
        return; // User chose to stay
      }
    }

    // Clear the cache
    clearCache();

    // Navigate back to tests list
    router.push('/tests');
  };

  // Submit form - single save button
  const onSubmit = async (data: any) => {
    startTransition(async () => {
      try {
        const result = await createTest({
          name: data.name,
          projectId: data.projectId,
          testNumber: data.testNumber || undefined,
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
          status: 'ready', // Always create as 'ready' status
          userId,
          organizationId,
        });

        if (result.success && result.test) {
          clearCache();
          toast.success(t('tests.create.messages.success'));
          router.push(`/tests/${result.test.id}`);
        } else {
          toast.error(result.error || t('tests.create.messages.error'));
        }
      } catch (error) {
        console.error('Error creating test:', error);
        toast.error(t('tests.create.messages.unexpectedError'));
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Form Fields (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <CardTitle>{t('tests.create.sections.basicInfo')}</CardTitle>
                  <CardDescription>
                    {t('tests.create.sections.basicInfoDescription')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <TemplateSelector onSelect={handleImportConfig} variant="button" />
                  <ImportConfigButton onImport={handleImportConfig} size="sm" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('tests.create.fields.testName.label')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('tests.create.fields.testName.placeholder')}
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
                        {t('tests.create.fields.project.label')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('tests.create.fields.project.placeholder')} />
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

                <FormField
                  control={control}
                  name="testNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tests.create.fields.testNumber.label')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('tests.create.fields.testNumber.placeholder')}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        {t('tests.create.fields.testNumber.hint')}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label htmlFor="description">{t('tests.create.fields.description.label')}</Label>
                  <Textarea
                    id="description"
                    placeholder={t('tests.create.fields.description.placeholder')}
                    rows={3}
                    {...register('description')}
                  />
                  {errors.description && <FormError error={errors.description.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">{t('tests.create.fields.tags.label')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder={t('tests.create.fields.tags.placeholder')}
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
                      {t('tests.create.fields.tags.addButton')}
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
                  <Label htmlFor="templateType">{t('tests.create.fields.templateType.label')}</Label>
                  <Controller
                    name="templateType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || 'daily'}>
                        <SelectTrigger id="templateType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">{t('tests.create.fields.templateType.daily')}</SelectItem>
                          <SelectItem value="extended">{t('tests.create.fields.templateType.extended')}</SelectItem>
                          <SelectItem value="custom">{t('tests.create.fields.templateType.custom')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Core Parameters */}
            <Card>
              <CardHeader>
                <CardTitle>{t('tests.create.sections.coreParams')}</CardTitle>
                <CardDescription>
                  {t('tests.create.sections.coreParamsDescription')}
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
                          {t('tests.create.fields.workingPressure.label')} <span className="text-destructive">*</span>
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
                          {t('tests.create.fields.maxPressure.label')} <span className="text-destructive">*</span>
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
                      {t('tests.create.fields.testDuration.label')} <span className="text-destructive">*</span>
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
                      {t('tests.create.fields.temperature.label')} <span className="text-destructive">*</span>
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
                      {t('tests.create.fields.allowablePressureDrop.label')} <span className="text-destructive">*</span>
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
                  <h4 className="text-sm font-medium">{t('tests.create.sections.testSchedule')}</h4>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDateTime">{t('tests.create.fields.startDateTime.label')}</Label>
                      <Input
                        id="startDateTime"
                        type="datetime-local"
                        value={startDateTime || ''}
                        onChange={(e) => handleStartDateTimeChange(e.target.value)}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('tests.create.fields.startDateTime.hint')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDateTime">{t('tests.create.fields.endDateTime.label')}</Label>
                      <Input
                        id="endDateTime"
                        type="datetime-local"
                        {...register('endDateTime')}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('tests.create.fields.endDateTime.hint')}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="equipmentId">{t('tests.create.fields.equipmentId.label')}</Label>
                    <Input id="equipmentId" placeholder={t('tests.create.fields.equipmentId.placeholder')} {...register('equipmentId')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operatorName">{t('tests.create.fields.operatorName.label')}</Label>
                    <Input id="operatorName" placeholder={t('tests.create.fields.operatorName.placeholder')} {...register('operatorName')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('tests.create.fields.notes.label')}</Label>
                  <Textarea id="notes" placeholder={t('tests.create.fields.notes.placeholder')} rows={3} {...register('notes')} />
                </div>
              </CardContent>
            </Card>

            {/* Intermediate Stages */}
            <Card>
              <CardHeader>
                <CardTitle>{t('tests.create.sections.intermediateStages')}</CardTitle>
                <CardDescription>
                  {t('tests.create.sections.intermediateStagesDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {watchedStages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t('tests.create.intermediateStages.noStages')}</p>
                    <p className="text-sm mt-1">{t('tests.create.intermediateStages.noStagesHint')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border rounded-lg">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">{t('tests.create.intermediateStages.tableHeaders.number')}</th>
                            <th className="px-3 py-2 text-left font-medium" title={t('tests.create.intermediateStages.tableHeaders.timeTooltip')}>
                              {t('tests.create.intermediateStages.tableHeaders.time')}
                            </th>
                            <th className="px-3 py-2 text-left font-medium" title={t('tests.create.intermediateStages.tableHeaders.cumulativeTooltip')}>
                              {t('tests.create.intermediateStages.tableHeaders.cumulative')}
                            </th>
                            <th className="px-3 py-2 text-left font-medium">{t('tests.create.intermediateStages.tableHeaders.pressure', { unit: pressureUnit })}</th>
                            <th className="px-3 py-2 text-left font-medium">{t('tests.create.intermediateStages.tableHeaders.hold')}</th>
                            <th className="px-3 py-2 text-center font-medium">{t('tests.create.intermediateStages.tableHeaders.actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {watchedStages.map((_stage, index) => {
                            const stagePressure = watchedStages[index]?.pressure || 0;
                            const isPressureBelowWorking = stagePressure > 0 && stagePressure < workingPressure;

                            // Calculate cumulative time
                            let cumulativeMinutes = 0;
                            for (let i = 0; i <= index; i++) {
                              cumulativeMinutes += watchedStages[i]?.time || 0;
                              if (i < index) {
                                cumulativeMinutes += watchedStages[i]?.duration || 0;
                              }
                            }

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
                                    title={t('tests.create.intermediateStages.tableHeaders.timeTooltip')}
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
                                    title={isPressureBelowWorking ? t('tests.create.intermediateStages.pressureWarning', { value: workingPressure, unit: pressureUnit }) : ''}
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

                    <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded">
                      <span>{t('tests.create.intermediateStages.totalStages', { count: watchedStages.length })}</span>
                    </div>
                  </div>
                )}

                <Button type="button" variant="outline" onClick={handleAddStage} className="w-full">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  {t('tests.create.buttons.addStage')}
                </Button>

                {errors.intermediateStages && (
                  <FormError error={errors.intermediateStages.message || t('testForm.invalidStagesConfiguration')} />
                )}
              </CardContent>
            </Card>

            {/* Single Save Button */}
            <Card>
              <CardFooter className="flex justify-between pt-6">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                    {t('tests.create.buttons.cancel')}
                  </Button>
                  <SaveAsTemplateButton
                    config={{
                      workingPressure: watch('workingPressure'),
                      maxPressure: watch('maxPressure'),
                      testDuration: watch('testDuration'),
                      temperature: watch('temperature'),
                      allowablePressureDrop: watch('allowablePressureDrop'),
                      pressureUnit: watch('pressureUnit'),
                      temperatureUnit: watch('temperatureUnit'),
                      intermediateStages: watch('intermediateStages'),
                      equipmentId: watch('equipmentId'),
                      operatorName: watch('operatorName'),
                      notes: watch('notes'),
                    }}
                    variant="outline"
                    size="default"
                  />
                </div>
                <Button type="submit" disabled={isPending}>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  {isPending ? t('tests.create.buttons.creating') : t('tests.create.buttons.create')}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column: Live Preview (1 column) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('tests.create.livePreview.title')}</CardTitle>
                    <CardDescription>
                      {t('tests.create.livePreview.description')}
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
        </div>
      </form>
    </Form>
  );
}
