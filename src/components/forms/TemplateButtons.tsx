// ═══════════════════════════════════════════════════════════════════
// Template Preset Buttons Component
// ═══════════════════════════════════════════════════════════════════

import { useTestStore } from '../../store/useTestStore';
import { useLanguage } from '../../i18n';
import { Card, CardHeader, CardBody, Button, Divider } from '@heroui/react';
import type { PresetTemplate } from '../../types';

export const TemplateButtons = () => {
  const { loadPreset, resetToDefaults } = useTestStore();
  const { t } = useLanguage();

  const templates: Array<{
    key: PresetTemplate;
    label: string;
    description: string;
    icon: string;
  }> = [
    {
      key: 'daily',
      label: t.dailyTest,
      description: t.dailyTestDescription,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      key: 'extended',
      label: t.extendedTest,
      description: t.extendedTestDescription,
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
  ];

  return (
    <Card shadow="lg" radius="lg">
      <CardHeader className="flex-col items-start gap-2 pb-3">
        <h2 className="text-base font-semibold text-foreground uppercase">
          {t.templatePresets}
        </h2>
        <p className="text-sm text-default-500">
          {t.templatePresetsDescription}
        </p>
      </CardHeader>
      <CardBody className="gap-2 p-4">
        {templates.map((template) => (
          <Button
            key={template.key}
            variant="bordered"
            onPress={() => loadPreset(template.key)}
            fullWidth
            size="md"
            className="h-auto py-3 px-3"
            startContent={
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={template.icon} />
              </svg>
            }
          >
            <div className="flex flex-col items-start gap-0.5 w-full">
              <span className="font-semibold text-sm">{template.label}</span>
              <span className="text-xs text-default-400 font-normal">
                {template.description}
              </span>
            </div>
          </Button>
        ))}
        <Divider className="my-2" />
        <Button
          variant="flat"
          onPress={resetToDefaults}
          fullWidth
          size="md"
          className="font-semibold text-sm uppercase"
          startContent={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        >
          {t.resetToDefaults}
        </Button>
      </CardBody>
    </Card>
  );
};
