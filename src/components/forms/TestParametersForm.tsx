// ═══════════════════════════════════════════════════════════════════
// Test Parameters Form Component
// ═══════════════════════════════════════════════════════════════════

import { useTestStore } from '../../store/useTestStore';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { InfoDisplayOption } from '../../types';

const infoDisplayOptions = [
  { value: 'under', label: 'Under Graph' },
  { value: 'on', label: 'On Graph' },
  { value: 'off', label: 'Off' },
];

export const TestParametersForm = () => {
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
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Test Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Test Number"
            type="text"
            value={testNumber}
            onChange={(e) => updateField('testNumber', e.target.value)}
            placeholder="20252401"
          />

          <Input
            label="Report Date"
            type="date"
            value={date}
            onChange={(e) => updateField('date', e.target.value)}
          />

          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
          />

          <Input
            label="Start Time"
            type="time"
            step="1"
            value={startTime}
            onChange={(e) => updateField('startTime', e.target.value)}
          />

          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => updateField('endDate', e.target.value)}
          />

          <Input
            label="End Time"
            type="time"
            step="1"
            value={endTime}
            onChange={(e) => updateField('endTime', e.target.value)}
          />

          <Input
            label="Test Duration (hours)"
            type="number"
            step="0.01"
            value={testDuration}
            onChange={(e) => updateField('testDuration', parseFloat(e.target.value))}
            helperText="Total test duration in hours"
          />

          <Input
            label="Working Pressure (MPa)"
            type="number"
            step="0.01"
            value={workingPressure}
            onChange={(e) => updateField('workingPressure', parseFloat(e.target.value))}
            helperText="Operating pressure level"
          />

          <Input
            label="Max Pressure (MPa)"
            type="number"
            step="0.01"
            value={maxPressure}
            onChange={(e) => updateField('maxPressure', parseFloat(e.target.value))}
            helperText="Maximum pressure reached"
          />

          <Input
            label="Temperature (°C)"
            type="number"
            step="1"
            value={temperature}
            onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
            helperText="Test temperature"
          />

          <Input
            label="Pressure Duration (minutes)"
            type="number"
            step="1"
            value={pressureDuration}
            onChange={(e) => updateField('pressureDuration', parseFloat(e.target.value))}
            helperText="Duration for holding pressure"
          />

          <Select
            label="Info Display"
            options={infoDisplayOptions}
            value={showInfo}
            onChange={(e) => updateField('showInfo', e.target.value as InfoDisplayOption)}
          />
        </div>

        <div className="mt-4">
          <Input
            label="Graph Title"
            type="text"
            value={graphTitle}
            onChange={(e) => updateField('graphTitle', e.target.value)}
            placeholder="График испытания давления"
          />
        </div>
      </div>
    </div>
  );
};
