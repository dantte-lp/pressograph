// ═══════════════════════════════════════════════════════════════════
// Type Definitions for Pressure Test Visualizer
// ═══════════════════════════════════════════════════════════════════

/**
 * Промежуточная опрессовка
 */
export interface PressureTest {
  id: string;
  time: number; // часы от начала испытания
  duration: number; // продолжительность в минутах
  pressure?: number; // МПа - давление опрессовки (если не указано, используется workingPressure)
  minPressure?: number; // МПа - минимальное давление во время удержания (дрейф вниз)
  maxPressure?: number; // МПа - максимальное давление во время удержания (дрейф вверх)
  targetPressure?: number; // МПа - целевое давление после сброса (если не указано, сбрасывается до 0)
  holdDrift?: number; // МПа - дрейф давления во время удержания до следующего теста (может быть положительным или отрицательным)
}

/**
 * Точка данных на графике
 */
export interface DataPoint {
  time: Date;
  pressure: number; // МПа
}

/**
 * Настройки испытания
 */
export interface TestSettings {
  testNumber: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:MM:SS
  testDuration: number; // часы
  workingPressure: number; // МПа
  maxPressure: number; // МПа
  temperature: number; // °C
  pressureDuration: number; // минуты
  graphTitle: string;
  showInfo: 'under' | 'on' | 'off';
  date: string; // дата отчета YYYY-MM-DD
  pressureTests: PressureTest[];
}

/**
 * Шаблон настроек
 */
export interface Template {
  name: string;
  settings: Omit<TestSettings, 'testNumber' | 'startDate' | 'startTime' | 'endDate' | 'endTime' | 'date'>;
}

/**
 * Предустановленные шаблоны
 */
export type PresetTemplate = 'daily' | 'extended';

/**
 * Опции для отображения информации
 */
export type InfoDisplayOption = 'under' | 'on' | 'off';

/**
 * Тема приложения
 */
export type Theme = 'light' | 'dark';

/**
 * Данные для генерации графика
 */
export interface GraphData {
  points: DataPoint[];
  startDateTime: Date;
  endDateTime: Date;
}

/**
 * Параметры экспорта
 */
export interface ExportOptions {
  format: 'png' | 'pdf';
  scale: number;
  filename?: string;
}
