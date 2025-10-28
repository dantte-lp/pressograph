// ═══════════════════════════════════════════════════════════════════
// Validation Service for Test Settings
// ═══════════════════════════════════════════════════════════════════

import type { TestSettings, ValidationResult, ValidationError, PressureTest } from '../types';
import { parseDateTime } from '../utils/helpers';

/**
 * Validate date string format (YYYY-MM-DD)
 * @param dateStr - Date string to validate
 * @returns true if valid format
 */
const isValidDateFormat = (dateStr: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/**
 * Validate time string format (HH:MM:SS)
 * @param timeStr - Time string to validate
 * @returns true if valid format
 */
const isValidTimeFormat = (timeStr: string): boolean => {
  const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
  if (!timeRegex.test(timeStr)) return false;

  const [hour, minute, second] = timeStr.split(':').map(Number);

  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59;
};

/**
 * Validate pressure test configuration
 * @param test - Pressure test to validate
 * @param index - Test index for error reporting
 * @returns Array of validation errors
 */
const validatePressureTest = (test: PressureTest, index: number): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate time offset
  if (typeof test.time !== 'number' || test.time < 0) {
    errors.push({
      field: `pressureTests[${index}].time`,
      message: `Pressure test #${index + 1}: Time must be a non-negative number`,
      rule: 'min:0',
    });
  }

  // Validate duration
  if (typeof test.duration !== 'number' || test.duration <= 0) {
    errors.push({
      field: `pressureTests[${index}].duration`,
      message: `Pressure test #${index + 1}: Duration must be a positive number`,
      rule: 'min:0.01',
    });
  }

  // Validate pressure if specified
  if (test.pressure !== undefined && (typeof test.pressure !== 'number' || test.pressure <= 0)) {
    errors.push({
      field: `pressureTests[${index}].pressure`,
      message: `Pressure test #${index + 1}: Pressure must be a positive number`,
      rule: 'min:0.01',
    });
  }

  // Validate minPressure if specified
  if (test.minPressure !== undefined && (typeof test.minPressure !== 'number' || test.minPressure < 0)) {
    errors.push({
      field: `pressureTests[${index}].minPressure`,
      message: `Pressure test #${index + 1}: Min pressure must be non-negative`,
      rule: 'min:0',
    });
  }

  // Validate maxPressure if specified
  if (test.maxPressure !== undefined && (typeof test.maxPressure !== 'number' || test.maxPressure < 0)) {
    errors.push({
      field: `pressureTests[${index}].maxPressure`,
      message: `Pressure test #${index + 1}: Max pressure must be non-negative`,
      rule: 'min:0',
    });
  }

  // Validate targetPressure if specified
  if (test.targetPressure !== undefined && (typeof test.targetPressure !== 'number' || test.targetPressure < 0)) {
    errors.push({
      field: `pressureTests[${index}].targetPressure`,
      message: `Pressure test #${index + 1}: Target pressure must be non-negative`,
      rule: 'min:0',
    });
  }

  // Validate holdDrift if specified
  if (test.holdDrift !== undefined && typeof test.holdDrift !== 'number') {
    errors.push({
      field: `pressureTests[${index}].holdDrift`,
      message: `Pressure test #${index + 1}: Hold drift must be a number`,
      rule: 'type:number',
    });
  }

  // Validate min/max pressure relationship
  if (test.minPressure !== undefined && test.maxPressure !== undefined && test.minPressure > test.maxPressure) {
    errors.push({
      field: `pressureTests[${index}]`,
      message: `Pressure test #${index + 1}: Min pressure cannot exceed max pressure`,
      rule: 'minPressure <= maxPressure',
    });
  }

  return errors;
};

/**
 * Validate complete test settings configuration
 * Performs comprehensive validation of all fields and relationships
 *
 * @param settings - Test settings to validate
 * @returns ValidationResult with errors array if validation fails
 */
export const validateTestSettings = (settings: TestSettings): ValidationResult => {
  const errors: ValidationError[] = [];

  // ═══════════════════════════════════════════════════════════════════
  // Required Fields Validation
  // ═══════════════════════════════════════════════════════════════════

  if (!settings.testNumber || typeof settings.testNumber !== 'string' || settings.testNumber.trim() === '') {
    errors.push({
      field: 'testNumber',
      message: 'Test number is required',
      rule: 'required',
    });
  }

  if (!settings.startDate || typeof settings.startDate !== 'string') {
    errors.push({
      field: 'startDate',
      message: 'Start date is required',
      rule: 'required',
    });
  }

  if (!settings.startTime || typeof settings.startTime !== 'string') {
    errors.push({
      field: 'startTime',
      message: 'Start time is required',
      rule: 'required',
    });
  }

  if (!settings.endDate || typeof settings.endDate !== 'string') {
    errors.push({
      field: 'endDate',
      message: 'End date is required',
      rule: 'required',
    });
  }

  if (!settings.endTime || typeof settings.endTime !== 'string') {
    errors.push({
      field: 'endTime',
      message: 'End time is required',
      rule: 'required',
    });
  }

  if (!settings.graphTitle || typeof settings.graphTitle !== 'string' || settings.graphTitle.trim() === '') {
    errors.push({
      field: 'graphTitle',
      message: 'Graph title is required',
      rule: 'required',
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Date/Time Format Validation
  // ═══════════════════════════════════════════════════════════════════

  if (settings.startDate && !isValidDateFormat(settings.startDate)) {
    errors.push({
      field: 'startDate',
      message: 'Start date must be in YYYY-MM-DD format',
      rule: 'format:YYYY-MM-DD',
    });
  }

  if (settings.endDate && !isValidDateFormat(settings.endDate)) {
    errors.push({
      field: 'endDate',
      message: 'End date must be in YYYY-MM-DD format',
      rule: 'format:YYYY-MM-DD',
    });
  }

  if (settings.startTime && !isValidTimeFormat(settings.startTime)) {
    errors.push({
      field: 'startTime',
      message: 'Start time must be in HH:MM:SS format',
      rule: 'format:HH:MM:SS',
    });
  }

  if (settings.endTime && !isValidTimeFormat(settings.endTime)) {
    errors.push({
      field: 'endTime',
      message: 'End time must be in HH:MM:SS format',
      rule: 'format:HH:MM:SS',
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Date/Time Range Validation
  // ═══════════════════════════════════════════════════════════════════

  if (
    settings.startDate &&
    settings.startTime &&
    settings.endDate &&
    settings.endTime &&
    isValidDateFormat(settings.startDate) &&
    isValidTimeFormat(settings.startTime) &&
    isValidDateFormat(settings.endDate) &&
    isValidTimeFormat(settings.endTime)
  ) {
    try {
      const startDateTime = parseDateTime(settings.startDate, settings.startTime);
      const endDateTime = parseDateTime(settings.endDate, settings.endTime);

      if (endDateTime <= startDateTime) {
        errors.push({
          field: 'endDate',
          message: 'End date/time must be after start date/time',
          rule: 'endDateTime > startDateTime',
        });
      }
    } catch (error) {
      errors.push({
        field: 'date',
        message: 'Invalid date/time combination',
        rule: 'valid_datetime',
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Numeric Fields Validation
  // ═══════════════════════════════════════════════════════════════════

  if (typeof settings.testDuration !== 'number' || settings.testDuration <= 0) {
    errors.push({
      field: 'testDuration',
      message: 'Test duration must be a positive number',
      rule: 'min:0.01',
    });
  }

  if (typeof settings.workingPressure !== 'number' || settings.workingPressure <= 0) {
    errors.push({
      field: 'workingPressure',
      message: 'Working pressure must be a positive number',
      rule: 'min:0.01',
    });
  }

  if (typeof settings.maxPressure !== 'number' || settings.maxPressure <= 0) {
    errors.push({
      field: 'maxPressure',
      message: 'Max pressure must be a positive number',
      rule: 'min:0.01',
    });
  }

  if (typeof settings.temperature !== 'number') {
    errors.push({
      field: 'temperature',
      message: 'Temperature must be a number',
      rule: 'type:number',
    });
  } else if (settings.temperature < -273.15 || settings.temperature > 1000) {
    errors.push({
      field: 'temperature',
      message: 'Temperature must be between -273.15°C and 1000°C',
      rule: 'range:-273.15:1000',
    });
  }

  if (typeof settings.pressureDuration !== 'number' || settings.pressureDuration <= 0) {
    errors.push({
      field: 'pressureDuration',
      message: 'Pressure duration must be a positive number',
      rule: 'min:0.01',
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Pressure Relationship Validation
  // ═══════════════════════════════════════════════════════════════════

  if (
    typeof settings.workingPressure === 'number' &&
    typeof settings.maxPressure === 'number' &&
    settings.workingPressure > settings.maxPressure
  ) {
    errors.push({
      field: 'workingPressure',
      message: 'Working pressure cannot exceed max pressure',
      rule: 'workingPressure <= maxPressure',
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Enum Validation
  // ═══════════════════════════════════════════════════════════════════

  if (!['under', 'on', 'off'].includes(settings.showInfo)) {
    errors.push({
      field: 'showInfo',
      message: 'Show info must be one of: under, on, off',
      rule: 'enum:under,on,off',
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // Pressure Tests Array Validation
  // ═══════════════════════════════════════════════════════════════════

  if (!Array.isArray(settings.pressureTests)) {
    errors.push({
      field: 'pressureTests',
      message: 'Pressure tests must be an array',
      rule: 'type:array',
    });
  } else {
    // Validate each pressure test
    settings.pressureTests.forEach((test, index) => {
      const testErrors = validatePressureTest(test, index);
      errors.push(...testErrors);
    });

    // Check for duplicate IDs
    const ids = settings.pressureTests.map((t) => t.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      errors.push({
        field: 'pressureTests',
        message: 'Pressure test IDs must be unique',
        rule: 'unique:id',
      });
    }

    // Validate test times are within test duration
    if (typeof settings.testDuration === 'number') {
      settings.pressureTests.forEach((test, index) => {
        if (test.time > settings.testDuration) {
          errors.push({
            field: `pressureTests[${index}].time`,
            message: `Pressure test #${index + 1}: Test time (${test.time}h) exceeds test duration (${settings.testDuration}h)`,
            rule: 'time <= testDuration',
          });
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
