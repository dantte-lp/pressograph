// ═══════════════════════════════════════════════════════════════════
// Test Parameters Form Component
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useTestStore } from '../../store/useTestStore';
import { useLanguage } from '../../i18n';
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Select,
  SelectItem,
  Divider,
  DatePicker,
  TimeInput,
  NumberInput
} from '@heroui/react';
import { parseDate, parseTime } from '@internationalized/date';
import type { InfoDisplayOption } from '../../types';

export const TestParametersForm = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();

  const infoDisplayOptions = [
    { value: 'under', label: t.infoDisplayUnder },
    { value: 'on', label: t.infoDisplayOn },
    { value: 'off', label: t.infoDisplayOff },
  ];

  const {
    testNumber,
    startDate,
    startTime,
    endDate,
    endTime,
    testDuration,
    workingPressure,
    maxPressure,
    temperature,
    pressureDuration,
    graphTitle,
    showInfo,
    date,
    updateField,
  } = useTestStore();

  return (
    <Card shadow="lg" radius="lg">
      <CardHeader
        className="flex justify-between items-center cursor-pointer hover:bg-default-100 transition-colors pb-4"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-default-900 dark:bg-default-100 rounded-md font-semibold text-default-50 dark:text-default-900 text-sm">1</div>
          <h2 className="text-base font-semibold text-foreground uppercase">
            {t.testParameters}
          </h2>
        </div>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'} text-default-500`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </CardHeader>

      {!isCollapsed && (
        <CardBody className="gap-6">
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600 uppercase tracking-wide">
              {t.generalInformation}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t.testNumberLabel}
                labelPlacement="outside"
                placeholder="20252401"
                value={testNumber}
                onValueChange={(value) => updateField('testNumber', value)}
                variant="bordered"
                classNames={{
                  label: "font-medium text-sm",
                  input: "text-sm",
                }}
              />

              <DatePicker
                label={t.reportDateLabel}
                labelPlacement="outside"
                value={date ? parseDate(date) : undefined}
                onChange={(value) => updateField('date', value?.toString() || '')}
                variant="bordered"
                classNames={{
                  label: "font-medium text-sm",
                  inputWrapper: "text-sm",
                }}
              />
            </div>
          </div>

          <Divider />

          {/* Time Parameters */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600 uppercase tracking-wide">
              {t.timeParameters}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker
                label={t.startDateLabel}
                labelPlacement="outside"
                value={startDate ? parseDate(startDate) : undefined}
                onChange={(value) => updateField('startDate', value?.toString() || '')}
                variant="bordered"
                classNames={{
                  label: "font-medium text-sm",
                  inputWrapper: "text-sm",
                }}
              />

              <TimeInput
                label={t.startTimeLabel}
                labelPlacement="outside"
                value={startTime ? parseTime(startTime) : undefined}
                onChange={(value) => updateField('startTime', value?.toString() || '')}
                variant="bordered"
                hourCycle={24}
                classNames={{
                  label: "font-medium text-sm",
                  inputWrapper: "text-sm",
                }}
              />

              <DatePicker
                label={t.endDateLabel}
                labelPlacement="outside"
                value={endDate ? parseDate(endDate) : undefined}
                onChange={(value) => updateField('endDate', value?.toString() || '')}
                variant="bordered"
                classNames={{
                  label: "font-medium text-sm",
                  inputWrapper: "text-sm",
                }}
              />

              <TimeInput
                label={t.endTimeLabel}
                labelPlacement="outside"
                value={endTime ? parseTime(endTime) : undefined}
                onChange={(value) => updateField('endTime', value?.toString() || '')}
                variant="bordered"
                hourCycle={24}
                classNames={{
                  label: "font-medium text-sm",
                  inputWrapper: "text-sm",
                }}
              />

              <NumberInput
                label={t.testDurationLabel}
                labelPlacement="outside"
                step={0.01}
                value={testDuration}
                onValueChange={(value) => updateField('testDuration', value || 0)}
                description={t.testDurationHelper}
                variant="bordered"
                classNames={{
                  label: "font-medium text-sm",
                  input: "text-sm",
                  description: "text-xs",
                }}
                endContent={
                  <span className="text-sm text-default-400">{t.unitHours}</span>
                }
              />
            </div>
          </div>

          <Divider />

          {/* Pressure Parameters */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600 uppercase tracking-wide">
              {t.pressureParameters}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInput
                label={t.workingPressureLabel}
                labelPlacement="outside"
                step={0.01}
                value={workingPressure}
                onValueChange={(value) => updateField('workingPressure', value || 0)}
                description={t.workingPressureHelper}
                variant="bordered"
                classNames={{
                  label: "font-medium text-sm",
                  input: "text-sm",
                  description: "text-xs",
                }}
                endContent={
                  <span className="text-sm text-default-400">{t.unitMPa}</span>
                }
              />

              <NumberInput
                label={t.maxPressureLabel}
                labelPlacement="outside"
                step={0.01}
                value={maxPressure}
                onValueChange={(value) => updateField('maxPressure', value || 0)}
                description={t.maxPressureHelper}
                variant="bordered"
                classNames={{
                  label: "font-medium text-sm",
                  input: "text-sm",
                  description: "text-xs",
                }}
                endContent={
                  <span className="text-sm text-default-400">{t.unitMPa}</span>
                }
              />

              <NumberInput
                label={t.pressureDurationLabel}
                labelPlacement="outside"
                step={1}
                value={pressureDuration}
                onValueChange={(value) => updateField('pressureDuration', value || 0)}
                description={t.pressureDurationHelper}
                variant="bordered"
                classNames={{
                  label: "font-medium text-sm",
                  input: "text-sm",
                  description: "text-xs",
                }}
                endContent={
                  <span className="text-sm text-default-400">{t.unitMinutes}</span>
                }
              />

              <NumberInput
                label={t.temperatureLabel}
                labelPlacement="outside"
                step={1}
                value={temperature}
                onValueChange={(value) => updateField('temperature', value || 0)}
                description={t.temperatureHelper}
                variant="bordered"
                classNames={{
                  label: "font-medium text-sm",
                  input: "text-sm",
                  description: "text-xs",
                }}
                endContent={
                  <span className="text-sm text-default-400">°C</span>
                }
              />
            </div>
          </div>

          <Divider />

          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600 uppercase tracking-wide">
              {t.displaySettings}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={t.infoDisplayLabel}
                labelPlacement="outside"
                selectedKeys={[showInfo]}
                onChange={(e) => updateField('showInfo', e.target.value as InfoDisplayOption)}
                variant="bordered"
                classNames={{
                  label: "font-medium text-sm",
                  value: "text-sm",
                }}
              >
                {infoDisplayOptions.map((option) => (
                  <SelectItem key={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>

              <Input
                label={t.graphTitleLabel}
                labelPlacement="outside"
                placeholder={t.graphTitlePlaceholder}
                value={graphTitle}
                onValueChange={(value) => updateField('graphTitle', value)}
                variant="bordered"
                classNames={{
                  label: "font-medium text-sm",
                  input: "text-sm",
                }}
              />
            </div>
          </div>
        </CardBody>
      )}
    </Card>
  );
};
