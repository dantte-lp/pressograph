// ═══════════════════════════════════════════════════════════════════
// English Translations
// ═══════════════════════════════════════════════════════════════════

export const en = {
  // App
  appTitle: 'Pressure Test Visualizer',
  appDescription: 'Generate professional pressure test graphs',
  footerText: 'Pressure Test Visualizer - Generate professional test graphs with ease',

  // Template Presets
  templatePresets: 'Template Presets',
  templatePresetsDescription: 'Load pre-configured test templates with typical settings',
  standardTest: 'Standard Test',
  standardTestDescription: '15.33h test with 3 intermediate checks',
  dailyTest: 'Daily Test',
  dailyTestDescription: '24h test with 5 intermediate checks',
  extendedTest: 'Extended Test',
  extendedTestDescription: '48h test with 7 intermediate checks',
  resetToDefaults: 'Reset to Defaults',

  // Test Parameters
  testParameters: 'Test Parameters',
  testNumber: 'Test Number',
  testNumberLabel: 'Test Number',
  reportDate: 'Report Date',
  reportDateLabel: 'Report Date',
  startDate: 'Start Date',
  startDateLabel: 'Start Date',
  startTime: 'Start Time',
  startTimeLabel: 'Start Time',
  endDate: 'End Date',
  endDateLabel: 'End Date',
  endTime: 'End Time',
  endTimeLabel: 'End Time',
  testDuration: 'Test Duration (hours)',
  testDurationLabel: 'Test Duration (hours)',
  testDurationHelper: 'Total test duration in hours',
  workingPressure: 'Working Pressure (MPa)',
  workingPressureLabel: 'Working Pressure (MPa)',
  workingPressureHelper: 'Operating pressure level',
  maxPressure: 'Max Pressure (MPa)',
  maxPressureLabel: 'Max Pressure (MPa)',
  maxPressureHelper: 'Maximum pressure reached',
  temperature: 'Temperature (°C)',
  temperatureLabel: 'Temperature (°C)',
  temperatureHelper: 'Test temperature',
  pressureDuration: 'Pressure Duration (minutes)',
  pressureDurationLabel: 'Pressure Duration (minutes)',
  pressureDurationHelper: 'Duration for holding pressure',
  infoDisplay: 'Info Display',
  infoDisplayLabel: 'Info Display',
  infoDisplayUnder: 'Under Graph',
  infoDisplayOn: 'On Graph',
  infoDisplayOff: 'Off',
  graphTitle: 'Graph Title',
  graphTitleLabel: 'Graph Title',
  graphTitlePlaceholder: 'Pressure Test Graph',

  // Intermediate Pressure Tests
  intermediatePressureTests: 'Intermediate Pressure Tests',
  addTest: 'Add Test',
  clearAll: 'Clear All',
  noIntermediateTests: 'No intermediate tests configured. Click "Add Test" to add one.',
  testTimeLabel: 'Time (hours)',
  testTimeHelper: 'Hours from test start',
  testDurationLabelTest: 'Duration (minutes)',
  testDurationHelperTest: 'Hold duration',
  remove: 'Remove',

  // Graph
  pressureTestGraph: 'Pressure Test Graph',

  // Export & Import
  exportImport: 'Export & Import',
  exportPNG: 'Export PNG',
  exportPDF: 'Export PDF',
  exportJSON: 'Export JSON',
  importJSON: 'Import JSON',
  exportDescription: 'Export the graph as PNG or PDF for reports. Save/load settings as JSON for later use.',
  importSuccess: 'Settings imported successfully!',
  importFailed: 'Import failed: {{error}}',

  // Theme
  darkMode: 'Dark Mode',
  lightMode: 'Light Mode',

  // Language
  language: 'Language',
  english: 'English',
  russian: 'Russian',

  // Quick Preset Intervals
  quickPresetIntervals: 'Quick Preset Intervals',
  quickPresetIntervalsDescription: 'Generate intermediate tests at regular intervals based on test duration',
  every: 'Every',

  // Section Headers
  generalInformation: 'General Information',
  timeParameters: 'Time Parameters',
  pressureParameters: 'Pressure Parameters',
  displaySettings: 'Display Settings',
  basicParameters: 'Basic Parameters',
  driftAndTargetParameters: 'Drift and Target Pressure Parameters',

  // Units
  unitHours: 'h',
  unitMinutes: 'min',
  unitMPa: 'MPa',

  // Test Labels
  test: 'Test',
  defaultValue: 'Default',
  duplicate: 'Duplicate',
  delete: 'Delete',
  optional: 'Optional',

  // Pressure Test Fields
  testPressure: 'Test Pressure',
  testPressureOptional: 'Optional (MPa)',
  minPressure: 'Min Pressure',
  minPressureDriftDown: 'Drift down (MPa)',
  maxPressureDriftUp: 'Drift up (MPa)',
  targetPressure: 'Target Pressure',
  targetPressureAfterRelease: 'After release (MPa)',
  holdDrift: 'Hold Drift',
  holdDriftUntilNext: 'Until next test (MPa)',

  // Navigation
  home: 'Home',
  history: 'History',
  admin: 'Admin',
  help: 'Help',
  login: 'Login',
};

export type TranslationKeys = typeof en;
