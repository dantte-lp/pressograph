// ═══════════════════════════════════════════════════════════════════
// Preset Quick Interval Buttons Component
// ═══════════════════════════════════════════════════════════════════

import { useTestStore } from '../../store/useTestStore';
import { Button } from '../ui/Button';
import { generateId } from '../../utils/helpers';

interface PresetInterval {
  label: string;
  hours: number;
}

const presetIntervals: PresetInterval[] = [
  { label: '6h', hours: 6 },
  { label: '8h', hours: 8 },
  { label: '12h', hours: 12 },
  { label: '24h', hours: 24 },
];

export const PresetButtons = () => {
  const { testDuration, pressureDuration, updateField } = useTestStore();

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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Quick Preset Intervals
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Generate intermediate tests at regular intervals based on test duration
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {presetIntervals.map((preset) => (
          <Button
            key={preset.hours}
            variant="secondary"
            onClick={() => applyPreset(preset.hours)}
            type="button"
          >
            Every {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
