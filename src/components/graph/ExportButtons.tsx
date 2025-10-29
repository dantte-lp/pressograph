// ═══════════════════════════════════════════════════════════════════
// Export Buttons Component
// ═══════════════════════════════════════════════════════════════════

import { useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useShallow } from 'zustand/react/shallow';
import { useTestStore } from '../../store/useTestStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useLanguage } from '../../i18n';
import { Card, CardHeader, CardBody, Button, Spinner } from '@heroui/react';
import { generatePressureData } from '../../utils/graphGenerator';
import { exportToPNG as exportToPNGClient, exportToPDF, exportSettings, importSettings } from '../../utils/export';
import { exportPNG as exportPNGBackend, formatFileSize, formatGenerationTime } from '../../services/api.service';
import { downloadFile } from '../../utils/helpers';
import type { TestSettings } from '../../types';

export const ExportButtons = () => {
  const { t } = useLanguage();
  const settings = useTestStore(
    useShallow((state): TestSettings => ({
      testNumber: state.testNumber,
      startDate: state.startDate,
      startTime: state.startTime,
      endDate: state.endDate,
      endTime: state.endTime,
      testDuration: state.testDuration,
      workingPressure: state.workingPressure,
      maxPressure: state.maxPressure,
      temperature: state.temperature,
      pressureDuration: state.pressureDuration,
      graphTitle: state.graphTitle,
      showInfo: state.showInfo,
      date: state.date,
      pressureTests: state.pressureTests,
    }))
  );
  const importSettingsFn = useTestStore((state) => state.importSettings);
  // PERFORMANCE FIX: Use useShallow to prevent unnecessary re-renders
  const theme = useThemeStore(useShallow((state) => state.theme));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading states for export operations
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  /**
   * Export PNG using backend API (server-side rendering)
   * Falls back to client-side export if backend is unavailable
   */
  const handleExportPNG = useCallback(async () => {
    setIsExportingPNG(true);
    const toastId = toast.loading('Генерация PNG...');

    try {
      // Try backend API first (higher quality, server-side rendering)
      const { blob, filename, metadata } = await exportPNGBackend({
        settings,
        theme,
        scale: 4, // High quality
        width: 1200,
        height: 800,
      });

      // Download file
      downloadFile(blob, filename);

      // Show success with metadata
      toast.success(
        `График экспортирован!\n${formatFileSize(metadata.fileSize)} • ${formatGenerationTime(metadata.generationTimeMs)}`,
        {
          id: toastId,
          duration: 3000,
        }
      );
    } catch (error) {
      console.warn('Backend PNG export failed, falling back to client-side:', error);

      // Fallback to client-side export
      try {
        const graphData = generatePressureData(settings);
        if (graphData.points.length === 0) {
          toast.error('Ошибка валидации настроек', { id: toastId });
          return;
        }

        exportToPNGClient(graphData, settings, theme);
        toast.success('График экспортирован (локально)', {
          id: toastId,
          duration: 2000,
        });
      } catch (clientError) {
        toast.error(`Ошибка экспорта: ${(clientError as Error).message}`, {
          id: toastId,
          duration: 5000,
        });
      }
    } finally {
      setIsExportingPNG(false);
    }
  }, [settings, theme]);

  const handleExportPDF = () => {
    const graphData = generatePressureData(settings);
    if (graphData.points.length === 0) return; // Skip if validation failed
    exportToPDF(graphData, settings, theme);
    toast.success('График экспортирован в PDF', {
      duration: 2000,
    });
  };

  const handleExportJSON = () => {
    exportSettings(settings);
    toast.success('Настройки экспортированы в JSON', {
      duration: 2000,
    });
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
        toast.success('Настройки успешно импортированы!', {
          duration: 3000,
        });
      },
      (error) => {
        toast.error(`Ошибка импорта: ${error}`, {
          duration: 5000,
        });
      }
    );

    // Reset input
    event.target.value = '';
  };

  return (
    <Card shadow="lg" radius="lg">
      <CardHeader className="flex-col items-start gap-2 pb-3">
        <h2 className="text-base font-semibold text-foreground uppercase">
          {t.exportImport}
        </h2>
        <p className="text-sm text-default-500">
          {t.exportDescription}
        </p>
      </CardHeader>
      <CardBody className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <Button
            variant="bordered"
            onPress={handleExportPNG}
            size="md"
            className="h-16"
            isDisabled={isExportingPNG}
            startContent={
              isExportingPNG ? (
                <Spinner size="sm" color="current" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )
            }
          >
            {isExportingPNG ? 'Экспорт...' : t.exportPNG}
          </Button>
          <Button
            variant="bordered"
            onPress={handleExportPDF}
            size="md"
            className="h-16"
            startContent={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          >
            {t.exportPDF}
          </Button>
          <Button
            variant="bordered"
            onPress={handleExportJSON}
            size="md"
            className="h-16"
            startContent={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            }
          >
            {t.exportJSON}
          </Button>
          <Button
            variant="bordered"
            onPress={handleImportJSON}
            size="md"
            className="h-16"
            startContent={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 17l4 4m0 0l4-4m-4 4V3" />
              </svg>
            }
          >
            {t.importJSON}
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
      </CardBody>
    </Card>
  );
};
