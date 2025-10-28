// ═══════════════════════════════════════════════════════════════════
// Home Page Component
// ═══════════════════════════════════════════════════════════════════

import { TestParametersForm } from '../components/forms/TestParametersForm';
import { PressureTestsList } from '../components/forms/PressureTestsList';
import { PresetButtons } from '../components/forms/PresetButtons';
import { TemplateButtons } from '../components/forms/TemplateButtons';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { ExportButtons } from '../components/graph/ExportButtons';
import { Divider } from '@heroui/react';

export const HomePage = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <TemplateButtons />
          <PresetButtons />
        </div>

        {/* Middle Column - Parameters & Tests */}
        <div className="lg:col-span-2 space-y-6">
          <TestParametersForm />
          <PressureTestsList />
        </div>
      </div>

      <Divider className="my-10 bg-slate-300 dark:bg-slate-700 h-0.5" />

      {/* Graph Section */}
      <div className="space-y-6">
        <GraphCanvas />
        <ExportButtons />
      </div>
    </main>
  );
};
