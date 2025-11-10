'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { PlusIcon, TrashIcon, SaveIcon } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
// Note: Error messages are now handled via i18n in the component
const intermediateStageSchema = z.object({
  time: z.number().min(0), // Minutes after previous stage
  pressure: z.number().min(0), // Target pressure
  duration: z.number().min(0), // Hold duration in minutes
});

const testSchema = z.object({
  name: z.string().min(3),
  testNumber: z.string().min(3).max(100),
  description: z.string().optional(),
  projectId: z.string().min(1),
  templateType: z.enum(['daily', 'extended', 'custom']),
  workingPressure: z.number().min(0.1),
  maxPressure: z.number().min(0.1),
  testDuration: z.number().min(0.1),
  temperature: z.number(),
  allowablePressureDrop: z.number().min(0),
  pressureUnit: z.enum(['MPa', 'Bar', 'PSI']),
  temperatureUnit: z.enum(['C', 'F']),
  equipmentId: z.string().optional(),
  operatorName: z.string().optional(),
  notes: z.string().optional(),
  startDateTime: z.string().optional(),
  endDateTime: z.string().optional(),
  intermediateStages: z.array(intermediateStageSchema).optional(),
  tags: z.string().optional(),
}).refine(
  (data) => {
    return !data.intermediateStages || data.intermediateStages.every(
      (stage) => stage.pressure >= data.workingPressure
    );
  },
  {
    message: 'stagePressureBelowWorking', // i18n key
    path: ['intermediateStages'],
  }
);

type TestFormData = z.infer<typeof testSchema>;

interface EditTestFormClientProps {
  test: any;
}

export function EditTestFormClient({ test }: EditTestFormClientProps) {
  const router = useRouter();
  const t = useTranslations();
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
      testNumber: test.testNumber,
      description: test.description || '',
      projectId: test.projectId,
      templateType: test.templateType || 'custom',
      workingPressure: test.config.workingPressure,
      maxPressure: test.config.maxPressure,
      testDuration: test.config.testDuration, // Keep in hours (not minutes)
      temperature: test.config.temperature || 20,
      allowablePressureDrop: test.config.allowablePressureDrop,
      pressureUnit: test.config.pressureUnit || 'MPa',
      temperatureUnit: (test.config.temperatureUnit as 'C' | 'F') || 'C',
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
      })) as { time: number; pressure: number; duration: number }[],
      tags: test.tags?.join(', ') || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'intermediateStages',
  });

  // Watch form values for live preview
  const formValues = watch();
  const intermediateStages = formValues.intermediateStages || [];

  // Debounce graph preview values to match create form behavior (300ms delay)
  // This ensures smooth, consistent rendering between create and edit pages
  const debouncedWorkingPressure = useDebounce(formValues.workingPressure ?? 10, 300);
  const debouncedMaxPressure = useDebounce(formValues.maxPressure ?? 15, 300);
  const debouncedTestDuration = useDebounce(formValues.testDuration ?? 24, 300);
  const debouncedIntermediateStages = useDebounce(intermediateStages, 300);
  const debouncedPressureUnit = useDebounce(formValues.pressureUnit ?? 'MPa', 300);

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const formData = watch();
      localStorage.setItem(`edit-test-draft-${test.id}`, JSON.stringify(formData));
    }, 30000); // 30 seconds

    return () => clearInterval(saveInterval);
  }, [watch, test.id]);

  // Restore from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`edit-test-draft-${test.id}`);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        Object.keys(parsedDraft).forEach((key) => {
          setValue(key as keyof TestFormData, parsedDraft[key]);
        });
      } catch (error) {
        console.error('Failed to restore draft:', error);
      }
    }
  }, [test.id, setValue]);

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
          testNumber: data.testNumber,
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
          // Clear localStorage draft on successful save
          localStorage.removeItem(`edit-test-draft-${test.id}`);
          toast.success(t('testForm.testUpdatedSuccess'));
          router.push(`/tests/${test.id}`);
          router.refresh();
        } else {
          toast.error(result.error || t('testForm.failedToUpdateTest'));
        }
      } catch (error) {
        console.error('Error updating test:', error);
        toast.error(t('testForm.unexpectedError'));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">{t('testForm.basicInfo')}</TabsTrigger>
          <TabsTrigger value="parameters">{t('testForm.parameters')}</TabsTrigger>
          <TabsTrigger value="stages">{t('testForm.stages')}</TabsTrigger>
          <TabsTrigger value="preview">{t('testForm.graphPreview')}</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4 mt-6">
          {/* Test Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('testForm.testName')} *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder={t('testForm.testNamePlaceholder')}
              aria-invalid={!!errors.name}
            />
            {errors.name && <FormError error={errors.name.message} />}
          </div>

          {/* Test Number */}
          <div className="space-y-2">
            <Label htmlFor="testNumber">{t('testForm.testNumberLabel')} *</Label>
            <Input
              id="testNumber"
              {...register('testNumber')}
              placeholder={t('testForm.testNumberPlaceholder')}
              aria-invalid={!!errors.testNumber}
            />
            <p className="text-sm text-muted-foreground">
              {t('testForm.testNumberHint')}
            </p>
            {errors.testNumber && <FormError error={errors.testNumber.message} />}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('testForm.descriptionLabel')}</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('testForm.descriptionPlaceholder')}
              rows={4}
            />
            {errors.description && <FormError error={errors.description.message} />}
          </div>

          <Separator className="my-6" />

          {/* Template Type */}
          <div className="space-y-2">
            <Label htmlFor="templateType">{t('testForm.templateType')}</Label>
            <Select
              value={formValues.templateType}
              onValueChange={(value) => setValue('templateType', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t('testForm.templateDaily')}</SelectItem>
                <SelectItem value="extended">{t('testForm.templateExtended')}</SelectItem>
                <SelectItem value="custom">{t('testForm.templateCustom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">{t('testForm.tagsLabel')}</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder={t('testForm.tagsPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('testForm.tagsHint')}
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
                  <CardTitle className="text-sm">{t('testForm.pressureSettings')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                {/* Working Pressure */}
                <div className="space-y-2">
                  <Label htmlFor="workingPressure">{t('testForm.workingPressure')} *</Label>
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
                  <Label htmlFor="maxPressure">{t('testForm.maximumPressure')} *</Label>
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
                  <Label htmlFor="allowablePressureDrop">{t('testForm.allowablePressureDrop')} *</Label>
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
                  <Label htmlFor="pressureUnit">{t('testForm.pressureUnit')}</Label>
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
                <CardTitle className="text-sm">{t('testForm.durationAndTemperature')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                {/* Test Duration */}
                <div className="space-y-2">
                  <Label htmlFor="testDuration">{t('testForm.testDurationHours')} *</Label>
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
                  <Label htmlFor="temperature">{t('testForm.temperature')} *</Label>
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
                <CardTitle className="text-sm">{t('testForm.testSchedule')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDateTime">{t('testForm.startDateTime')}</Label>
                    <Input
                      id="startDateTime"
                      type="datetime-local"
                      {...register('startDateTime')}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('testForm.startDateTimeHint')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDateTime">{t('testForm.endDateTime')}</Label>
                    <Input
                      id="endDateTime"
                      type="datetime-local"
                      {...register('endDateTime')}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('testForm.endDateTimeHint')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment and Operator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('testForm.equipmentAndOperator')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="equipmentId">{t('testForm.equipmentId')}</Label>
                    <Input
                      id="equipmentId"
                      placeholder={t('testForm.equipmentIdPlaceholder')}
                      {...register('equipmentId')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operatorName">{t('testForm.operatorName')}</Label>
                    <Input
                      id="operatorName"
                      placeholder={t('testForm.operatorNamePlaceholder')}
                      {...register('operatorName')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('testForm.notes')}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t('testForm.notesPlaceholder')}
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
                    <CardTitle className="text-sm">{t('testForm.livePreview')}</CardTitle>
                    <CardDescription className="text-xs">
                      {t('testForm.livePreviewDescription')}
                    </CardDescription>
                  </div>
                  <PreviewDialog
                    workingPressure={debouncedWorkingPressure}
                    maxPressure={debouncedMaxPressure}
                    testDuration={debouncedTestDuration}
                    intermediateStages={debouncedIntermediateStages}
                    pressureUnit={debouncedPressureUnit}
                    startDateTime={formValues.startDateTime}
                    endDateTime={formValues.endDateTime}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <PressureTestPreview
                  workingPressure={debouncedWorkingPressure}
                  maxPressure={debouncedMaxPressure}
                  testDuration={debouncedTestDuration}
                  intermediateStages={debouncedIntermediateStages}
                  pressureUnit={debouncedPressureUnit}
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
              <CardTitle className="text-base">{t('testForm.intermediateStages')}</CardTitle>
              <CardDescription>
                {t('testForm.intermediateStagesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('testForm.noStagesAdded')}</p>
                  <p className="text-sm mt-1">{t('testForm.clickAddStage')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-lg">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">#</th>
                          <th className="px-3 py-2 text-left font-medium" title={t('testForm.timeTooltip')}>
                            {t('testForm.timeMinutes')}
                          </th>
                          <th className="px-3 py-2 text-left font-medium">{t('testForm.pressure')} ({formValues.pressureUnit ?? 'MPa'})</th>
                          <th className="px-3 py-2 text-left font-medium">{t('testForm.holdMinutes')}</th>
                          <th className="px-3 py-2 text-center font-medium">{t('testForm.actions')}</th>
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
                                title={t('testForm.timeTooltip')}
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
                    <span>{t('testForm.totalStages', { count: fields.length })}</span>
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
                {t('testForm.addStage')}
              </Button>

              {errors.intermediateStages && (
                <FormError error={errors.intermediateStages.message || t('testForm.invalidStagesConfiguration')} />
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
                  <CardTitle>{t('testForm.graphPreviewTitle')}</CardTitle>
                  <CardDescription>
                    {t('testForm.graphPreviewDescription')}
                  </CardDescription>
                </div>
                <PreviewDialog
                  workingPressure={debouncedWorkingPressure}
                  maxPressure={debouncedMaxPressure}
                  testDuration={debouncedTestDuration}
                  intermediateStages={debouncedIntermediateStages}
                  pressureUnit={debouncedPressureUnit}
                  startDateTime={formValues.startDateTime}
                  endDateTime={formValues.endDateTime}
                />
              </div>
            </CardHeader>
            <CardContent>
              <PressureTestPreview
                workingPressure={debouncedWorkingPressure}
                maxPressure={debouncedMaxPressure}
                testDuration={debouncedTestDuration}
                intermediateStages={debouncedIntermediateStages}
                pressureUnit={debouncedPressureUnit}
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
          {t('testForm.cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          <SaveIcon className="mr-2 h-4 w-4" />
          {isPending ? t('testForm.saving') : t('testForm.saveChanges')}
        </Button>
      </div>
    </form>
  );
}
