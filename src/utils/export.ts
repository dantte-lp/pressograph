// ═══════════════════════════════════════════════════════════════════
// Export Utilities (PNG, PDF, JSON)
// ═══════════════════════════════════════════════════════════════════

import { jsPDF } from 'jspdf';
import type { GraphData, TestSettings, Theme } from '../types';
import { renderGraph } from './canvasRenderer';
import { downloadFile, getFilenameDateString } from './helpers';

/**
 * Экспорт графика в PNG с высоким разрешением
 */
export const exportToPNG = (
  graphData: GraphData,
  settings: TestSettings,
  theme: Theme
): void => {
  // Создаем временный canvas
  const canvas = document.createElement('canvas');

  // Высокое разрешение для экспорта
  renderGraph(canvas, graphData, settings, {
    width: 1123,
    height: 794,
    scale: 4,
    theme,
  });

  // Конвертируем в PNG
  canvas.toBlob((blob) => {
    if (blob) {
      const filename = `pressure_test_graph_${settings.testNumber}_${getFilenameDateString()}.png`;
      downloadFile(blob, filename);
    }
  }, 'image/png', 1.0);
};

/**
 * Экспорт графика в PDF
 */
export const exportToPDF = (
  graphData: GraphData,
  settings: TestSettings,
  theme: Theme
): void => {
  // Создаем временный canvas
  const canvas = document.createElement('canvas');

  // Высокое разрешение для экспорта
  renderGraph(canvas, graphData, settings, {
    width: 1123,
    height: 794,
    scale: 4,
    theme,
  });

  // Конвертируем canvas в Data URL
  const imgData = canvas.toDataURL('image/png', 1.0);

  // Создаем PDF (альбомная ориентация, A4)
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);

  // Скачиваем PDF
  const filename = `pressure_test_graph_${settings.testNumber}_${getFilenameDateString()}.pdf`;
  pdf.save(filename);
};

/**
 * Экспорт настроек в JSON
 */
export const exportSettings = (settings: TestSettings): void => {
  const dataStr = JSON.stringify(settings, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const filename = `pressure_test_${settings.testNumber}_${getFilenameDateString()}.json`;
  downloadFile(blob, filename);
};

/**
 * Импорт настроек из JSON
 */
export const importSettings = (
  file: File,
  onSuccess: (settings: Partial<TestSettings>) => void,
  onError: (error: string) => void
): void => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const result = e.target?.result;
      if (typeof result === 'string') {
        const settings = JSON.parse(result) as Partial<TestSettings>;
        onSuccess(settings);
      } else {
        onError('Неверный формат файла');
      }
    } catch (error) {
      onError(`Ошибка при импорте настроек: ${(error as Error).message}`);
    }
  };

  reader.onerror = () => {
    onError('Не удалось прочитать файл');
  };

  reader.readAsText(file);
};
