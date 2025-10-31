import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateId,
  parseDateTime,
  formatDateTime,
  addNoise,
  downloadFile,
  getFilenameDateString,
} from './helpers';

describe('Utility Helpers', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should include timestamp component', () => {
      const id = generateId();
      const timestampPart = id.split('-')[0];
      const timestamp = parseInt(timestampPart, 10);

      expect(timestamp).toBeGreaterThan(Date.now() - 1000); // Within last second
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('parseDateTime', () => {
    it('should parse valid date and time strings', () => {
      const result = parseDateTime('2025-10-31', '14:30:00');

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(9); // October (0-indexed)
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
    });

    it('should handle single-digit values', () => {
      const result = parseDateTime('2025-01-05', '09:05:03');

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(5);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(5);
      expect(result.getSeconds()).toBe(3);
    });
  });

  describe('formatDateTime', () => {
    it('should format date to graph display format', () => {
      const date = new Date(2025, 9, 31, 14, 30, 0); // Oct 31, 2025, 14:30
      const result = formatDateTime(date);

      expect(result).toBe('14:00:00 31.10.2025');
    });

    it('should pad single-digit values with zeros', () => {
      const date = new Date(2025, 0, 5, 9, 0, 0); // Jan 5, 2025, 09:00
      const result = formatDateTime(date);

      expect(result).toBe('09:00:00 05.01.2025');
    });

    it('should always show :00:00 for hours (graph format)', () => {
      const date = new Date(2025, 5, 15, 23, 45, 30); // June 15, 2025, 23:45:30
      const result = formatDateTime(date);

      expect(result).toBe('23:00:00 15.06.2025');
    });
  });

  describe('addNoise', () => {
    it('should add noise within specified range', () => {
      const pressure = 50.0;
      const maxNoise = 0.5;
      const results: number[] = [];

      // Generate multiple results to test randomness
      for (let i = 0; i < 100; i++) {
        const noisy = addNoise(pressure, maxNoise);
        results.push(noisy);

        // Should be within range
        expect(noisy).toBeGreaterThanOrEqual(pressure - maxNoise / 2);
        expect(noisy).toBeLessThanOrEqual(pressure + maxNoise / 2);
      }

      // Results should have some variation (not all identical)
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(10);
    });

    it('should return 0 for 0 pressure', () => {
      const result = addNoise(0, 0.5);
      expect(result).toBe(0);
    });

    it('should use default maxNoise of 0.5 if not specified', () => {
      const pressure = 100.0;
      const result = addNoise(pressure);

      expect(result).toBeGreaterThanOrEqual(pressure - 0.25);
      expect(result).toBeLessThanOrEqual(pressure + 0.25);
    });
  });

  describe('downloadFile', () => {
    let createElementSpy: any;
    let createObjectURLSpy: any;
    let revokeObjectURLSpy: any;
    let mockLink: { href: string; download: string; click: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockReturnValue(mockLink as unknown as HTMLElement);
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    });

    it('should create download link and trigger download', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test-file.txt';

      downloadFile(blob, filename);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('getFilenameDateString', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const result = getFilenameDateString();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return current date', () => {
      const result = getFilenameDateString();
      const today = new Date().toISOString().split('T')[0];

      expect(result).toBe(today);
    });
  });
});
