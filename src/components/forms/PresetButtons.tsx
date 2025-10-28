// ═══════════════════════════════════════════════════════════════════
// Preset Quick Interval Buttons Component
// ═══════════════════════════════════════════════════════════════════

import { useTestStore } from '../../store/useTestStore';
import { useLanguage } from '../../i18n';
import { Card, CardHeader, CardBody, Button } from '@heroui/react';
import { generateId } from '../../utils/helpers';

interface PresetInterval {
  label: string;
  hours: number;
  icon: string;
  color: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

export const PresetButtons = () => {
  const { testDuration, pressureDuration, updateField } = useTestStore();
  const { t } = useLanguage();

  const presetIntervals: Omit<PresetInterval, 'color'>[] = [
    {
      label: '6ч',
      hours: 6,
      icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: '8ч',
      hours: 8,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: '12ч',
      hours: 12,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: '24ч',
      hours: 24,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  const generateTestsForInterval = (intervalHours: number) => {
    const tests = [];
    let currentTime = intervalHours;

    while (currentTime < testDuration) {
      tests.push({
        id: generateId(),
        time: currentTime,
        duration: pressureDuration,
      });
      currentTime += intervalHours;
    }

    return tests;
  };

  const applyPreset = (intervalHours: number) => {
    const tests = generateTestsForInterval(intervalHours);
    updateField('pressureTests', tests);
  };

  return (
    <Card shadow="lg" radius="lg">
      <CardHeader className="flex-col items-start gap-2 pb-3">
        <h2 className="text-base font-semibold text-foreground uppercase">
          {t.quickPresetIntervals}
        </h2>
        <p className="text-sm text-default-500">
          {t.quickPresetIntervalsDescription}
        </p>
      </CardHeader>
      <CardBody className="gap-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          {presetIntervals.map((preset) => (
            <Button
              key={preset.hours}
              variant="bordered"
              onPress={() => applyPreset(preset.hours)}
              size="md"
              className="h-16"
              startContent={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={preset.icon} />
                </svg>
              }
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-xs font-medium opacity-70">{t.every}</span>
                <span className="font-semibold text-sm">{preset.label}</span>
              </div>
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
