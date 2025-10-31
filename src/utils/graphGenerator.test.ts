import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePressureData } from './graphGenerator';
import type { TestSettings } from '../types';
import toast from 'react-hot-toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('Graph Generator', () => {
  describe('generatePressureData', () => {
    let baseSettings: TestSettings;

    beforeEach(() => {
      vi.clearAllMocks();

      baseSettings = {
        testNumber: 'TEST-001',
        startDate: '2025-10-31',
        startTime: '10:00:00',
        endDate: '2025-10-31',
        endTime: '14:00:00',
        testDuration: 4,
        workingPressure: 50.0,
        maxPressure: 60.0,
        temperature: 20,
        pressureDuration: 60,
        graphTitle: 'Test Graph',
        showInfo: 'under',
        date: '2025-10-31',
        pressureTests: [],
        comment: 'Test comment',
      };
    });

    describe('Basic Graph Generation', () => {
      it('should generate graph data with valid settings', () => {
        const result = generatePressureData(baseSettings);

        expect(result).toBeDefined();
        expect(result.points).toBeDefined();
        expect(result.points.length).toBeGreaterThan(0);
        expect(result.startDateTime).toBeInstanceOf(Date);
        expect(result.endDateTime).toBeInstanceOf(Date);
      });

      it('should start at 0 pressure', () => {
        const result = generatePressureData(baseSettings);
        expect(result.points[0].pressure).toBe(0);
      });

      it('should end at 0 pressure', () => {
        const result = generatePressureData(baseSettings);
        const lastPoint = result.points[result.points.length - 1];
        expect(lastPoint.pressure).toBe(0);
      });

      it('should reach working pressure during hold phase', () => {
        const result = generatePressureData(baseSettings);
        const workingPressurePoints = result.points.filter(
          (p) => Math.abs(p.pressure - baseSettings.workingPressure) < 5
        );
        expect(workingPressurePoints.length).toBeGreaterThan(0);
      });

      it('should have chronologically ordered points', () => {
        const result = generatePressureData(baseSettings);
        for (let i = 1; i < result.points.length; i++) {
          expect(result.points[i].time.getTime()).toBeGreaterThanOrEqual(
            result.points[i - 1].time.getTime()
          );
        }
      });

      it('should not have duplicate timestamps', () => {
        const result = generatePressureData(baseSettings);
        const timestamps = result.points.map((p) => p.time.getTime());
        const uniqueTimestamps = new Set(timestamps);
        expect(uniqueTimestamps.size).toBe(timestamps.length);
      });
    });

    describe('Date Validation', () => {
      it('should handle invalid date range (end before start)', () => {
        const invalidSettings: TestSettings = {
          ...baseSettings,
          startTime: '14:00:00',
          endTime: '10:00:00',
        };

        const result = generatePressureData(invalidSettings);
        expect(toast.error).toHaveBeenCalled();
        expect(result.points).toEqual([]);
      });

      it('should handle same start and end time', () => {
        const invalidSettings: TestSettings = {
          ...baseSettings,
          startTime: '10:00:00',
          endTime: '10:00:00',
        };

        const result = generatePressureData(invalidSettings);
        expect(toast.error).toHaveBeenCalled();
        expect(result.points).toEqual([]);
      });
    });

    describe('Intermediate Pressure Tests', () => {
      it('should generate intermediate test with specified pressure', () => {
        const settingsWithTest: TestSettings = {
          ...baseSettings,
          endTime: '16:00:00',
          pressureTests: [
            {
              id: 'test-1',
              time: 3,
              duration: 30,
              pressure: 60.0,
            },
          ],
        };

        const result = generatePressureData(settingsWithTest);
        expect(result.points.length).toBeGreaterThan(0);

        const intermediatePressurePoints = result.points.filter(
          (p) => Math.abs(p.pressure - 60.0) < 5
        );
        expect(intermediatePressurePoints.length).toBeGreaterThan(0);
      });

      it('should handle multiple intermediate tests', () => {
        const settingsWithTests: TestSettings = {
          ...baseSettings,
          endTime: '18:00:00',
          pressureTests: [
            {
              id: 'test-1',
              time: 2,
              duration: 30,
              pressure: 60.0,
            },
            {
              id: 'test-2',
              time: 5,
              duration: 30,
              pressure: 70.0,
            },
          ],
        };

        const result = generatePressureData(settingsWithTests);
        expect(result.points.length).toBeGreaterThan(0);

        const test1Points = result.points.filter((p) => Math.abs(p.pressure - 60.0) < 5);
        const test2Points = result.points.filter((p) => Math.abs(p.pressure - 70.0) < 5);

        expect(test1Points.length).toBeGreaterThan(0);
        expect(test2Points.length).toBeGreaterThan(0);
      });

      it('should sort intermediate tests by time', () => {
        const settingsWithUnsortedTests: TestSettings = {
          ...baseSettings,
          endTime: '18:00:00',
          pressureTests: [
            {
              id: 'test-1',
              time: 5,
              duration: 30,
              pressure: 70.0,
            },
            {
              id: 'test-2',
              time: 2,
              duration: 30,
              pressure: 60.0,
            },
          ],
        };

        const result = generatePressureData(settingsWithUnsortedTests);
        expect(result.points.length).toBeGreaterThan(0);

        for (let i = 1; i < result.points.length; i++) {
          expect(result.points[i].time.getTime()).toBeGreaterThanOrEqual(
            result.points[i - 1].time.getTime()
          );
        }
      });
    });

    describe('Pressure Calculations', () => {
      it('should never have negative pressure values', () => {
        const result = generatePressureData(baseSettings);
        result.points.forEach((point) => {
          expect(point.pressure).toBeGreaterThanOrEqual(0);
        });
      });

      it('should add realistic noise to pressure readings', () => {
        const result = generatePressureData(baseSettings);
        const steadyStatePoints = result.points.filter(
          (p) => Math.abs(p.pressure - baseSettings.workingPressure) < 5
        );

        const uniquePressures = new Set(steadyStatePoints.map((p) => p.pressure));
        expect(uniquePressures.size).toBeGreaterThan(1);
      });
    });

    describe('Edge Cases', () => {
      it('should handle very short test duration', () => {
        const shortTest: TestSettings = {
          ...baseSettings,
          startTime: '10:00:00',
          endTime: '10:05:00',
          testDuration: 0.083,
          pressureDuration: 2,
        };

        const result = generatePressureData(shortTest);
        expect(result.points.length).toBeGreaterThan(0);
        expect(result.points[0].pressure).toBe(0);
        expect(result.points[result.points.length - 1].pressure).toBe(0);
      });

      it('should handle very long test duration', () => {
        const longTest: TestSettings = {
          ...baseSettings,
          startDate: '2025-10-31',
          startTime: '00:00:00',
          endDate: '2025-11-01',
          endTime: '00:00:00',
          testDuration: 24,
          pressureDuration: 120,
        };

        const result = generatePressureData(longTest);
        expect(result.points.length).toBeGreaterThan(0);
      });

      it('should handle zero working pressure', () => {
        const zeroSettings: TestSettings = {
          ...baseSettings,
          workingPressure: 0,
        };

        const result = generatePressureData(zeroSettings);
        expect(result.points.length).toBeGreaterThan(0);

        result.points.forEach((point) => {
          expect(Math.abs(point.pressure)).toBeLessThan(2);
        });
      });

      it('should handle high working pressure', () => {
        const highPressure: TestSettings = {
          ...baseSettings,
          workingPressure: 150.0,
          maxPressure: 180.0,
        };

        const result = generatePressureData(highPressure);
        expect(result.points.length).toBeGreaterThan(0);

        const maxPressurePoints = result.points.filter((p) => Math.abs(p.pressure - 150.0) < 10);
        expect(maxPressurePoints.length).toBeGreaterThan(0);
      });

      it('should handle empty pressureTests array', () => {
        const noTests: TestSettings = {
          ...baseSettings,
          pressureTests: [],
        };

        const result = generatePressureData(noTests);
        expect(result.points.length).toBeGreaterThan(0);
        expect(result.startDateTime).toBeInstanceOf(Date);
        expect(result.endDateTime).toBeInstanceOf(Date);
      });
    });
  });
});
