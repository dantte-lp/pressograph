// ═══════════════════════════════════════════════════════════════════
// Shared Type Definitions for Pressure Test Graph Generation
// ═══════════════════════════════════════════════════════════════════

/**
 * Intermediate pressure test configuration
 * Represents a single pressure test that occurs during the overall test duration
 */
export interface PressureTest {
  /** Unique identifier for the test */
  id: string;

  /** Time offset from test start in hours */
  time: number;

  /** Duration of the pressure hold in minutes */
  duration: number;

  /** Test pressure in MPa (if not specified, uses workingPressure) */
  pressure?: number;

  /** Minimum pressure during hold (downward drift) in MPa */
  minPressure?: number;

  /** Maximum pressure during hold (upward drift) in MPa */
  maxPressure?: number;

  /** Target pressure after depressurization in MPa (if not specified, drops to 0) */
  targetPressure?: number;

  /** Pressure drift during hold period until next test in MPa (can be positive or negative) */
  holdDrift?: number;
}

/**
 * Single data point on the pressure-time graph
 */
export interface DataPoint {
  /** Timestamp of the measurement */
  time: Date;

  /** Pressure value in MPa */
  pressure: number;
}

/**
 * Complete test configuration settings
 * Contains all parameters needed to generate a pressure test graph
 */
export interface TestSettings {
  /** Test identification number */
  testNumber: string;

  /** Test start date in YYYY-MM-DD format */
  startDate: string;

  /** Test start time in HH:MM:SS format */
  startTime: string;

  /** Test end date in YYYY-MM-DD format */
  endDate: string;

  /** Test end time in HH:MM:SS format */
  endTime: string;

  /** Total test duration in hours */
  testDuration: number;

  /** Working (nominal) pressure in MPa */
  workingPressure: number;

  /** Maximum allowed pressure in MPa */
  maxPressure: number;

  /** Test temperature in °C */
  temperature: number;

  /** Duration of initial pressure hold in minutes */
  pressureDuration: number;

  /** Graph title/heading */
  graphTitle: string;

  /** Information display mode */
  showInfo: 'under' | 'on' | 'off';

  /** Report date in YYYY-MM-DD format */
  date: string;

  /** Array of intermediate pressure tests */
  pressureTests: PressureTest[];
}

/**
 * Template for test settings
 * Excludes dynamic fields like dates and test number
 */
export interface Template {
  /** Template name */
  name: string;

  /** Template settings (excluding test number and dates) */
  settings: Omit<TestSettings, 'testNumber' | 'startDate' | 'startTime' | 'endDate' | 'endTime' | 'date'>;
}

/**
 * Preset template types
 */
export type PresetTemplate = 'daily' | 'extended';

/**
 * Information display options for graph rendering
 */
export type InfoDisplayOption = 'under' | 'on' | 'off';

/**
 * Application theme (for rendering purposes)
 */
export type Theme = 'light' | 'dark';

/**
 * Generated graph data
 * Contains calculated data points and time bounds
 */
export interface GraphData {
  /** Array of calculated pressure-time data points */
  points: DataPoint[];

  /** Actual start timestamp of the test */
  startDateTime: Date;

  /** Actual end timestamp of the test */
  endDateTime: Date;
}

/**
 * Export configuration options
 */
export interface ExportOptions {
  /** Output format */
  format: 'png' | 'pdf' | 'json';

  /** Rendering scale factor (for image quality) */
  scale: number;

  /** Optional custom filename */
  filename?: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;

  /** Human-readable error message */
  message: string;

  /** Optional validation rule that failed */
  rule?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Array of validation errors (if any) */
  errors: ValidationError[];
}
