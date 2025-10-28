// ═══════════════════════════════════════════════════════════════════
// Main Application Component
// ═══════════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useThemeStore } from './store/useThemeStore';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { TestParametersForm } from './components/forms/TestParametersForm';
import { PressureTestsList } from './components/forms/PressureTestsList';
import { PresetButtons } from './components/forms/PresetButtons';
import { TemplateButtons } from './components/forms/TemplateButtons';
import { GraphCanvas } from './components/graph/GraphCanvas';
import { ExportButtons } from './components/graph/ExportButtons';

function App() {
  const theme = useThemeStore((state) => state.theme);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Pressure Test Visualizer
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate professional pressure test graphs
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
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

        {/* Graph Section */}
        <div className="mt-6 space-y-6">
          <GraphCanvas />
          <ExportButtons />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Pressure Test Visualizer - Generate professional test graphs with ease</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
