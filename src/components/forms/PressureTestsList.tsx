// ═══════════════════════════════════════════════════════════════════
// Pressure Tests List Component
// ═══════════════════════════════════════════════════════════════════

import { useTestStore } from '../../store/useTestStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const PressureTestsList = () => {
  const { pressureTests, addPressureTest, removePressureTest, updatePressureTest, clearAllTests } =
    useTestStore();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Intermediate Pressure Tests
        </h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={addPressureTest} type="button">
            Add Test
          </Button>
          {pressureTests.length > 0 && (
            <Button variant="danger" onClick={clearAllTests} type="button">
              Clear All
            </Button>
          )}
        </div>
      </div>

      {pressureTests.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No intermediate tests configured. Click "Add Test" to add one.
        </div>
      ) : (
        <div className="space-y-4">
          {pressureTests.map((test, index) => (
            <div
              key={test.id}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md"
            >
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <Input
                  label={`Test ${index + 1} - Time (hours)`}
                  type="number"
                  step="0.1"
                  value={test.time}
                  onChange={(e) =>
                    updatePressureTest(test.id, 'time', parseFloat(e.target.value))
                  }
                  helperText="Hours from test start"
                />
                <Input
                  label={`Test ${index + 1} - Duration (minutes)`}
                  type="number"
                  step="1"
                  value={test.duration}
                  onChange={(e) =>
                    updatePressureTest(test.id, 'duration', parseFloat(e.target.value))
                  }
                  helperText="Hold duration"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="danger"
                  onClick={() => removePressureTest(test.id)}
                  fullWidth
                  type="button"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
