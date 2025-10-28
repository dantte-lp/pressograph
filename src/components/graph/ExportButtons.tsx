// ═══════════════════════════════════════════════════════════════════
// Export Buttons Component
// ═══════════════════════════════════════════════════════════════════

import { useRef } from 'react';
import { useTestStore } from '../../store/useTestStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Button } from '../ui/Button';
import { generatePressureData } from '../../utils/graphGenerator';
import { exportToPNG, exportToPDF, exportSettings, importSettings } from '../../utils/export';

export const ExportButtons = () => {
  const settings = useTestStore((state) => state.exportSettings());
  const importSettingsFn = useTestStore((state) => state.importSettings);
  const theme = useThemeStore((state) => state.theme);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportPNG = () => {
    const graphData = generatePressureData(settings);
    exportToPNG(graphData, settings, theme);
  };

  const handleExportPDF = () => {
    const graphData = generatePressureData(settings);
    exportToPDF(graphData, settings, theme);
  };

  const handleExportJSON = () => {
    exportSettings(settings);
  };

  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importSettings(
      file,
      (importedSettings) => {
        importSettingsFn(importedSettings);
        alert('Settings imported successfully!');
      },
      (error) => {
        alert(`Import failed: ${error}`);
      }
    );

    // Reset input
    event.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Export & Import
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Button variant="primary" onClick={handleExportPNG} type="button">
          Export PNG
        </Button>
        <Button variant="primary" onClick={handleExportPDF} type="button">
          Export PDF
        </Button>
        <Button variant="secondary" onClick={handleExportJSON} type="button">
          Export JSON
        </Button>
        <Button variant="secondary" onClick={handleImportJSON} type="button">
          Import JSON
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Import JSON file"
      />
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Export the graph as PNG or PDF for reports. Save/load settings as JSON for later use.
      </p>
    </div>
  );
};
