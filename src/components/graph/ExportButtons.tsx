// ═══════════════════════════════════════════════════════════════════
// Export Buttons Component
// ═══════════════════════════════════════════════════════════════════

import { useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useShallow } from 'zustand/react/shallow';
import { useTestStore } from '../../store/useTestStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useLanguage } from '../../i18n';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  RadioGroup,
  Radio,
} from '@heroui/react';
import { generatePressureData } from '../../utils/graphGenerator';
import {
  exportToPNG as exportToPNGClient,
  exportSettings,
  importSettings,
} from '../../utils/export';
import {
  exportPNG as exportPNGBackend,
  exportPDF as exportPDFBackend,
  exportJSON as exportJSONBackend,
  formatFileSize,
  formatGenerationTime,
} from '../../services/api.service';
import { downloadFile } from '../../utils/helpers';
import type { TestSettings } from '../../types';

export const ExportButtons = () => {
  const { t } = useLanguage();
  const settings = useTestStore(
    useShallow(
      (state): TestSettings => ({
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
        comment: state.comment,
      })
    )
  );
  const { isDirty, markAsSaved } = useTestStore(
    useShallow((state) => ({ isDirty: state.isDirty, markAsSaved: state.markAsSaved }))
  );
  const importSettingsFn = useTestStore((state) => state.importSettings);
  // PERFORMANCE FIX: Use useShallow to prevent unnecessary re-renders
  const theme = useThemeStore(useShallow((state) => state.theme));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading states for export operations
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Comment modal state (for optional override)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentOverride, setCommentOverride] = useState('');
  const [exportType, setExportType] = useState<'save' | 'png' | 'pdf' | 'json'>('save');
  const [exportTheme, setExportTheme] = useState<'current' | 'light' | 'dark'>('current');

  /**
   * Open comment modal before export (optional override of comment from Test Parameters)
   */
  const openCommentModal = useCallback(
    (type: 'save' | 'png' | 'pdf' | 'json') => {
      setExportType(type);
      setCommentOverride(settings.comment || '');
      setExportTheme('current'); // Reset to current theme
      setIsCommentModalOpen(true);
    },
    [settings.comment]
  );

  /**
   * Execute export with comment
   */
  const executeExport = useCallback(async () => {
    setIsCommentModalOpen(false);

    switch (exportType) {
      case 'save':
        await handleSave();
        break;
      case 'png':
        await handleExportPNG();
        break;
      case 'pdf':
        await handleExportPDF();
        break;
      case 'json':
        await handleExportJSON();
        break;
    }
  }, [exportType]);

  /**
   * Export PNG using backend API (server-side rendering)
   * Falls back to client-side export if backend is unavailable
   */
  const handleExportPNG = useCallback(async () => {
    setIsExportingPNG(true);
    const toastId = toast.loading('Генерация PNG...');

    try {
      // Determine theme to use for export
      const themeToUse = exportTheme === 'current' ? theme : exportTheme;

      // Try backend API first (higher quality, server-side rendering)
      const { blob, filename, metadata } = await exportPNGBackend({
        settings,
        theme: themeToUse,
        scale: 4, // High quality
        width: 1200,
        height: 800,
        comment: commentOverride || undefined,
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
  }, [settings, theme, commentOverride, exportTheme]);

  /**
   * Export PDF using backend API
   */
  const handleExportPDF = useCallback(async () => {
    setIsExportingPDF(true);
    const toastId = toast.loading('Генерация PDF...');

    try {
      // Determine theme to use for export
      const themeToUse = exportTheme === 'current' ? theme : exportTheme;

      const { blob, filename, metadata } = await exportPDFBackend({
        settings,
        theme: themeToUse,
        scale: 4,
        width: 1200,
        height: 800,
        comment: commentOverride || undefined,
      });

      downloadFile(blob, filename);

      toast.success(
        `PDF экспортирован!\n${formatFileSize(metadata.fileSize)} • ${formatGenerationTime(metadata.generationTimeMs)}`,
        {
          id: toastId,
          duration: 3000,
        }
      );
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error(`Ошибка экспорта PDF: ${(error as Error).message}`, {
        id: toastId,
        duration: 5000,
      });
    } finally {
      setIsExportingPDF(false);
    }
  }, [settings, theme, commentOverride, exportTheme]);

  /**
   * Export JSON using backend API
   */
  const handleExportJSON = useCallback(async () => {
    setIsExportingJSON(true);
    const toastId = toast.loading('Генерация JSON...');

    try {
      const { blob, filename, metadata } = await exportJSONBackend({
        settings,
        comment: commentOverride || undefined,
      });

      downloadFile(blob, filename);

      toast.success(
        `JSON экспортирован!\n${formatFileSize(metadata.fileSize)} • ${formatGenerationTime(metadata.generationTimeMs)}`,
        {
          id: toastId,
          duration: 3000,
        }
      );
    } catch (error) {
      console.error('JSON export failed:', error);
      toast.error(`Ошибка экспорта JSON: ${(error as Error).message}`, {
        id: toastId,
        duration: 5000,
      });
    } finally {
      setIsExportingJSON(false);
    }
  }, [settings, commentOverride]);

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

  /**
   * Handle save button click
   * Saves the current graph to backend and marks as saved
   */
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const toastId = toast.loading(`${t.saveGraph}...`);

    try {
      // Determine theme to use for export
      const themeToUse = exportTheme === 'current' ? theme : exportTheme;

      // Export PNG to backend (which also saves to database)
      const { blob, filename, metadata } = await exportPNGBackend({
        settings,
        theme: themeToUse,
        scale: 4,
        width: 1200,
        height: 800,
        comment: commentOverride || undefined,
      });

      // Mark as saved (no longer dirty)
      markAsSaved();

      toast.success(t.saveSuccess, {
        id: toastId,
        duration: 3000,
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(t.saveFailed, {
        id: toastId,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [settings, theme, markAsSaved, t, commentOverride, exportTheme]);

  return (
    <>
      <Card shadow="lg" radius="lg">
        <CardHeader className="flex-col items-start gap-2 pb-3">
          <h2 className="text-base font-semibold text-foreground uppercase">{t.exportImport}</h2>
          <p className="text-sm text-default-500">{t.exportDescription}</p>
        </CardHeader>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <Button
              color="primary"
              variant={isDirty ? 'solid' : 'bordered'}
              onPress={() => openCommentModal('save')}
              size="md"
              className="h-16"
              isDisabled={isSaving || !isDirty}
              isLoading={isSaving}
              startContent={
                !isSaving && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                )
              }
            >
              {isSaving ? 'Сохранение...' : t.saveGraph}
              {isDirty && <span className="ml-1">•</span>}
            </Button>
            <Button
              variant="bordered"
              onPress={() => openCommentModal('png')}
              size="md"
              className="h-16"
              isDisabled={isExportingPNG}
              startContent={
                isExportingPNG ? (
                  <Spinner size="sm" color="current" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                )
              }
            >
              {isExportingPNG ? 'Экспорт...' : t.exportPNG}
            </Button>
            <Button
              variant="bordered"
              onPress={() => openCommentModal('pdf')}
              size="md"
              className="h-16"
              isDisabled={isExportingPDF}
              startContent={
                isExportingPDF ? (
                  <Spinner size="sm" color="current" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                )
              }
            >
              {isExportingPDF ? 'Экспорт...' : t.exportPDF}
            </Button>
            <Button
              variant="bordered"
              onPress={() => openCommentModal('json')}
              size="md"
              className="h-16"
              isDisabled={isExportingJSON}
              startContent={
                isExportingJSON ? (
                  <Spinner size="sm" color="current" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                )
              }
            >
              {isExportingJSON ? 'Экспорт...' : t.exportJSON}
            </Button>
            <Button
              variant="bordered"
              onPress={handleImportJSON}
              size="md"
              className="h-16"
              startContent={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M8 17l4 4m0 0l4-4m-4 4V3"
                  />
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

      {/* Comment Modal */}
      <Modal isOpen={isCommentModalOpen} onClose={() => setIsCommentModalOpen(false)} size="lg">
        <ModalContent>
          <ModalHeader>
            {exportType === 'save' ? 'Сохранить график' : 'Настройки экспорта'}
          </ModalHeader>
          <ModalBody className="gap-4">
            {/* Theme Selection - only show for PNG and PDF exports */}
            {(exportType === 'png' || exportType === 'pdf' || exportType === 'save') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Тема графика</label>
                <RadioGroup
                  value={exportTheme}
                  onValueChange={(value) => setExportTheme(value as 'current' | 'light' | 'dark')}
                  orientation="horizontal"
                >
                  <Radio value="current" description="Использовать текущую тему приложения">
                    Текущая
                  </Radio>
                  <Radio value="light" description="Светлый фон и темный текст">
                    Светлая
                  </Radio>
                  <Radio value="dark" description="Темный фон и светлый текст">
                    Темная
                  </Radio>
                </RadioGroup>
                <p className="text-xs text-default-500 mt-1">
                  Текущая тема: <strong>{theme === 'dark' ? 'Темная' : 'Светлая'}</strong>
                </p>
              </div>
            )}

            {/* Comment Input */}
            <div className="space-y-2">
              <Textarea
                label="Комментарий (опционально)"
                placeholder="Введите комментарий к графику..."
                value={commentOverride}
                onValueChange={setCommentOverride}
                minRows={3}
                maxRows={6}
                variant="bordered"
              />
              <p className="text-xs text-default-500">
                {settings.comment
                  ? 'Изменить комментарий из "Параметры испытания" для этого экспорта.'
                  : 'Комментарий будет сохранен вместе с графиком и отображен в истории.'}
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsCommentModalOpen(false)}>
              Отмена
            </Button>
            <Button color={exportType === 'save' ? 'success' : 'primary'} onPress={executeExport}>
              {exportType === 'save' ? 'Сохранить' : 'Экспортировать'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
