// ═══════════════════════════════════════════════════════════════════
// Home Page Component
// ═══════════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTestStore } from '../store/useTestStore';
import { useLanguage } from '../i18n';
import { TestParametersForm } from '../components/forms/TestParametersForm';
import { PressureTestsList } from '../components/forms/PressureTestsList';
import { PresetButtons } from '../components/forms/PresetButtons';
import { TemplateButtons } from '../components/forms/TemplateButtons';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { ExportButtons } from '../components/graph/ExportButtons';
import { Divider } from '@heroui/react';

export const HomePage = () => {
  const { t } = useLanguage();
  const isDirty = useTestStore(useShallow((state) => state.isDirty));

  /**
   * Warn user before leaving page with unsaved changes
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but we still need to set returnValue
        e.returnValue = t.unsavedChangesMessage;
        return t.unsavedChangesMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, t]);

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
