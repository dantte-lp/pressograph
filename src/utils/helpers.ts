// ═══════════════════════════════════════════════════════════════════
// Utility Helper Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Генерация уникального ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Парсинг даты и времени
 */
export const parseDateTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute, second] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
};

/**
 * Форматирование даты и времени для графика
 */
export const formatDateTime = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:00:00 ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
};

/**
 * Добавление шума к значению давления
 */
export const addNoise = (pressure: number, maxNoise: number = 0.5): number => {
  if (pressure === 0) return 0;
  return pressure + (Math.random() - 0.5) * maxNoise;
};

/**
 * Скачивание файла
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Форматирование даты для имени файла
 */
export const getFilenameDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};
