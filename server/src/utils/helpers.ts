// ═══════════════════════════════════════════════════════════════════
// Utility Helper Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse date and time strings into a Date object
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM:SS format
 * @returns Date object
 */
export const parseDateTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute, second] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
};

/**
 * Add noise to pressure value for realistic graph simulation
 * @param pressure - Base pressure value in MPa
 * @param maxNoise - Maximum noise amplitude (default: 0.5 MPa)
 * @returns Pressure value with added noise
 */
export const addNoise = (pressure: number, maxNoise: number = 0.5): number => {
  if (pressure === 0) return 0;
  return pressure + (Math.random() - 0.5) * maxNoise;
};

/**
 * Generate unique ID for resources
 * @returns Unique ID string
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format filename-safe date string
 * @returns ISO date string (YYYY-MM-DD)
 */
export const getFilenameDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};
