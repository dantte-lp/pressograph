// ═══════════════════════════════════════════════════════════════════
// Template Preset Buttons Component
// ═══════════════════════════════════════════════════════════════════

import { useTestStore } from '../../store/useTestStore';
import { Button } from '../ui/Button';
import type { PresetTemplate } from '../../types';

interface TemplateConfig {
  key: PresetTemplate;
  label: string;
  description: string;
}

const templates: TemplateConfig[] = [
  {
    key: 'standard',
    label: 'Standard Test',
    description: '15.33h test with 3 intermediate checks',
  },
  {
    key: 'daily',
    label: 'Daily Test',
    description: '24h test with 5 intermediate checks',
  },
  {
    key: 'extended',
    label: 'Extended Test',
    description: '48h test with 7 intermediate checks',
  },
];

export const TemplateButtons = () => {
  const { loadPreset, resetToDefaults } = useTestStore();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Template Presets
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Load pre-configured test templates with typical settings
      </p>
      <div className="space-y-3">
        {templates.map((template) => (
          <div key={template.key} className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              onClick={() => loadPreset(template.key)}
              className="flex-1"
              type="button"
            >
              {template.label}
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400 sm:flex sm:items-center px-2">
              {template.description}
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={resetToDefaults}
            fullWidth
            type="button"
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
};
