// ═══════════════════════════════════════════════════════════════════
// Russian Translations
// ═══════════════════════════════════════════════════════════════════

import type { TranslationKeys } from './en';

export const ru: TranslationKeys = {
  // App
  appTitle: 'Визуализатор испытаний давления',
  appDescription: 'Создание профессиональных графиков испытаний давления',
  footerText: 'Визуализатор испытаний давления - Создавайте профессиональные графики испытаний легко',

  // Template Presets
  templatePresets: 'Шаблоны настроек',
  templatePresetsDescription: 'Загрузите предварительно настроенные шаблоны испытаний',
  standardTest: 'Стандартное испытание',
  standardTestDescription: '15.33ч испытание с 3 промежуточными проверками',
  dailyTest: 'Суточное испытание',
  dailyTestDescription: '24ч испытание с 5 промежуточными проверками',
  extendedTest: 'Расширенное испытание',
  extendedTestDescription: '48ч испытание с 7 промежуточными проверками',
  resetToDefaults: 'Сбросить по умолчанию',

  // Test Parameters
  testParameters: 'Параметры испытания',
  testNumber: 'Номер испытания',
  testNumberLabel: 'Номер испытания',
  reportDate: 'Дата отчета',
  reportDateLabel: 'Дата отчета',
  startDate: 'Дата начала',
  startDateLabel: 'Дата начала',
  startTime: 'Время начала',
  startTimeLabel: 'Время начала',
  endDate: 'Дата окончания',
  endDateLabel: 'Дата окончания',
  endTime: 'Время окончания',
  endTimeLabel: 'Время окончания',
  testDuration: 'Длительность испытания (часы)',
  testDurationLabel: 'Длительность испытания (часы)',
  testDurationHelper: 'Общая длительность испытания в часах',
  workingPressure: 'Рабочее давление (МПа)',
  workingPressureLabel: 'Рабочее давление (МПа)',
  workingPressureHelper: 'Уровень рабочего давления',
  maxPressure: 'Макс. давление (МПа)',
  maxPressureLabel: 'Макс. давление (МПа)',
  maxPressureHelper: 'Максимальное достигнутое давление',
  temperature: 'Температура (°C)',
  temperatureLabel: 'Температура (°C)',
  temperatureHelper: 'Температура испытания',
  pressureDuration: 'Длительность давления (минуты)',
  pressureDurationLabel: 'Длительность давления (минуты)',
  pressureDurationHelper: 'Длительность удержания давления',
  infoDisplay: 'Отображение информации',
  infoDisplayLabel: 'Отображение информации',
  infoDisplayUnder: 'Под графиком',
  infoDisplayOn: 'На графике',
  infoDisplayOff: 'Выключено',
  graphTitle: 'Заголовок графика',
  graphTitleLabel: 'Заголовок графика',
  graphTitlePlaceholder: 'График испытания давления',

  // Intermediate Pressure Tests
  intermediatePressureTests: 'Промежуточные испытания давлением',
  addTest: 'Добавить испытание',
  clearAll: 'Очистить всё',
  noIntermediateTests: 'Промежуточные испытания не настроены. Нажмите "Добавить испытание" для добавления.',
  testTimeLabel: 'Время (часы)',
  testTimeHelper: 'Часов от начала испытания',
  testDurationLabelTest: 'Длительность (минуты)',
  testDurationHelperTest: 'Длительность удержания',
  remove: 'Удалить',

  // Graph
  pressureTestGraph: 'График испытания давления',

  // Export & Import
  exportImport: 'Экспорт и импорт',
  exportPNG: 'Экспорт PNG',
  exportPDF: 'Экспорт PDF',
  exportJSON: 'Экспорт JSON',
  importJSON: 'Импорт JSON',
  exportDescription: 'Экспортируйте график как PNG или PDF для отчетов. Сохраняйте/загружайте настройки в формате JSON для последующего использования.',
  importSuccess: 'Настройки успешно импортированы!',
  importFailed: 'Ошибка импорта: {{error}}',

  // Theme
  darkMode: 'Темная тема',
  lightMode: 'Светлая тема',

  // Language
  language: 'Язык',
  english: 'English',
  russian: 'Русский',

  // Quick Preset Intervals
  quickPresetIntervals: 'Быстрые интервалы',
  quickPresetIntervalsDescription: 'Генерация промежуточных испытаний с регулярными интервалами на основе длительности испытания',
  every: 'Каждые',

  // Section Headers
  generalInformation: 'Общая информация',
  timeParameters: 'Временные параметры',
  pressureParameters: 'Параметры давления',
  displaySettings: 'Настройки отображения',
  basicParameters: 'Основные параметры',
  driftAndTargetParameters: 'Параметры дрейфа и целевого давления',

  // Units
  unitHours: 'ч',
  unitMinutes: 'мин',
  unitMPa: 'МПа',

  // Test Labels
  test: 'Испытание',
  defaultValue: 'По умолчанию',
  duplicate: 'Дублировать',
  delete: 'Удалить',
  optional: 'Опционально',

  // Pressure Test Fields
  testPressure: 'Давление теста',
  testPressureOptional: 'Опционально (МПа)',
  minPressure: 'Мин. давление',
  minPressureDriftDown: 'Дрейф вниз (МПа)',
  maxPressureDriftUp: 'Дрейф вверх (МПа)',
  targetPressure: 'Целевое давление',
  targetPressureAfterRelease: 'После сброса (МПа)',
  holdDrift: 'Дрейф удержания',
  holdDriftUntilNext: 'До след. теста (МПа)',

  // Navigation
  home: 'Главная',
  history: 'История',
  admin: 'Админ',
  help: 'Помощь',
  login: 'Вход',
};
