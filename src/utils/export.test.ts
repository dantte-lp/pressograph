import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToPNG, exportToPDF, exportSettings, importSettings } from './export';
import type { GraphData, TestSettings, Theme } from '../types';
import * as canvasRenderer from './canvasRenderer';
import * as helpers from './helpers';

// Mock dependencies
vi.mock('./canvasRenderer', () => ({
  renderGraph: vi.fn(),
}));

vi.mock('./helpers', () => ({
  downloadFile: vi.fn(),
  getFilenameDateString: vi.fn(() => '20251031_120000'),
}));

// Mock jsPDF with proper constructor
const mockPdfInstance = {
  addImage: vi.fn(),
  save: vi.fn(),
};

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => {
    return mockPdfInstance;
  }),
}));

describe('Export Utilities', () => {
  let mockGraphData: GraphData;
  let mockSettings: TestSettings;
  let mockCanvas: HTMLCanvasElement;
  let mockBlob: Blob;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock GraphData
    mockGraphData = {
      points: [
        { time: new Date('2025-10-31T10:00:00'), pressure: 0 },
        { time: new Date('2025-10-31T11:00:00'), pressure: 50 },
        { time: new Date('2025-10-31T14:00:00'), pressure: 50 },
        { time: new Date('2025-10-31T15:00:00'), pressure: 0 },
      ],
      startDateTime: new Date('2025-10-31T10:00:00'),
      endDateTime: new Date('2025-10-31T15:00:00'),
    };

    // Mock TestSettings
    mockSettings = {
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

    // Mock Blob
    mockBlob = new Blob(['test'], { type: 'image/png' });

    // Mock Canvas
    mockCanvas = {
      toBlob: vi.fn((callback) => callback(mockBlob)),
      toDataURL: vi.fn(() => 'data:image/png;base64,mockImageData'),
      getContext: vi.fn(() => ({})),
      width: 0,
      height: 0,
    } as unknown as HTMLCanvasElement;

    // Mock document.createElement
    global.document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return {} as HTMLElement;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportToPNG', () => {
    it('should create a canvas element', () => {
      const theme: Theme = 'light';
      exportToPNG(mockGraphData, mockSettings, theme);

      expect(document.createElement).toHaveBeenCalledWith('canvas');
    });

    it('should render graph with high resolution settings', () => {
      const theme: Theme = 'light';
      exportToPNG(mockGraphData, mockSettings, theme);

      expect(canvasRenderer.renderGraph).toHaveBeenCalledWith(
        mockCanvas,
        mockGraphData,
        mockSettings,
        {
          width: 1123,
          height: 794,
          scale: 4,
          theme,
        }
      );
    });

    it('should convert canvas to PNG blob', () => {
      const theme: Theme = 'light';
      exportToPNG(mockGraphData, mockSettings, theme);

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', 1.0);
    });

    it('should download file with correct filename', () => {
      const theme: Theme = 'light';
      exportToPNG(mockGraphData, mockSettings, theme);

      expect(helpers.downloadFile).toHaveBeenCalledWith(
        mockBlob,
        'pressure_test_graph_TEST-001_20251031_120000.png'
      );
    });

    it('should work with dark theme', () => {
      const theme: Theme = 'dark';
      exportToPNG(mockGraphData, mockSettings, theme);

      expect(canvasRenderer.renderGraph).toHaveBeenCalledWith(
        mockCanvas,
        mockGraphData,
        mockSettings,
        expect.objectContaining({ theme: 'dark' })
      );
    });

    it('should not download if blob is null', () => {
      mockCanvas.toBlob = vi.fn((callback) => callback(null));
      const theme: Theme = 'light';

      exportToPNG(mockGraphData, mockSettings, theme);

      expect(helpers.downloadFile).not.toHaveBeenCalled();
    });
  });

  describe('exportToPDF', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create a canvas element', () => {
      const theme: Theme = 'light';
      exportToPDF(mockGraphData, mockSettings, theme);

      expect(document.createElement).toHaveBeenCalledWith('canvas');
    });

    it('should render graph with high resolution settings', () => {
      const theme: Theme = 'light';
      exportToPDF(mockGraphData, mockSettings, theme);

      expect(canvasRenderer.renderGraph).toHaveBeenCalledWith(
        mockCanvas,
        mockGraphData,
        mockSettings,
        {
          width: 1123,
          height: 794,
          scale: 4,
          theme,
        }
      );
    });

    it('should convert canvas to data URL', () => {
      const theme: Theme = 'light';
      exportToPDF(mockGraphData, mockSettings, theme);

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png', 1.0);
    });

    it('should create PDF with landscape orientation and A4 size', async () => {
      const jsPDFModule = await import('jspdf');
      const theme: Theme = 'light';

      exportToPDF(mockGraphData, mockSettings, theme);

      expect(jsPDFModule.jsPDF).toHaveBeenCalledWith('landscape', 'mm', 'a4');
    });

    it('should add image to PDF with correct dimensions', () => {
      const theme: Theme = 'light';
      exportToPDF(mockGraphData, mockSettings, theme);

      expect(mockPdfInstance.addImage).toHaveBeenCalledWith(
        'data:image/png;base64,mockImageData',
        'PNG',
        0,
        0,
        297,
        210
      );
    });

    it('should save PDF with correct filename', () => {
      const theme: Theme = 'light';
      exportToPDF(mockGraphData, mockSettings, theme);

      expect(mockPdfInstance.save).toHaveBeenCalledWith(
        'pressure_test_graph_TEST-001_20251031_120000.pdf'
      );
    });

    it('should work with dark theme', () => {
      const theme: Theme = 'dark';
      exportToPDF(mockGraphData, mockSettings, theme);

      expect(canvasRenderer.renderGraph).toHaveBeenCalledWith(
        mockCanvas,
        mockGraphData,
        mockSettings,
        expect.objectContaining({ theme: 'dark' })
      );
    });
  });

  describe('exportSettings', () => {
    it('should convert settings to JSON string', () => {
      const blobSpy = vi.spyOn(global, 'Blob');

      exportSettings(mockSettings);

      expect(blobSpy).toHaveBeenCalledWith([JSON.stringify(mockSettings, null, 2)], {
        type: 'application/json',
      });
    });

    it('should create blob with application/json type', () => {
      const blobSpy = vi.spyOn(global, 'Blob');

      exportSettings(mockSettings);

      const callArgs = blobSpy.mock.calls[0];
      expect(callArgs?.[1]).toEqual({ type: 'application/json' });
    });

    it('should download file with correct filename', () => {
      exportSettings(mockSettings);

      expect(helpers.downloadFile).toHaveBeenCalledWith(
        expect.any(Blob),
        'pressure_test_TEST-001_20251031_120000.json'
      );
    });

    it('should include all settings fields in JSON', () => {
      const blobSpy = vi.spyOn(global, 'Blob');

      exportSettings(mockSettings);

      const jsonString = blobSpy.mock.calls[0]?.[0]?.[0] as string;
      const parsedSettings = JSON.parse(jsonString);

      expect(parsedSettings.testNumber).toBe('TEST-001');
      expect(parsedSettings.workingPressure).toBe(50.0);
      expect(parsedSettings.comment).toBe('Test comment');
    });

    it('should format JSON with proper indentation', () => {
      const blobSpy = vi.spyOn(global, 'Blob');

      exportSettings(mockSettings);

      const jsonString = blobSpy.mock.calls[0]?.[0]?.[0] as string;
      expect(jsonString).toContain('\n');
      expect(jsonString).toContain('  ');
    });
  });

  describe('importSettings', () => {
    let mockFile: File;
    let mockFileReader: Partial<FileReader> & {
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null;
      onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null;
      readAsText: ReturnType<typeof vi.fn>;
    };
    let onSuccessSpy: ReturnType<typeof vi.fn>;
    let onErrorSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      onSuccessSpy = vi.fn();
      onErrorSpy = vi.fn();

      mockFile = new File([JSON.stringify(mockSettings)], 'test.json', {
        type: 'application/json',
      });

      mockFileReader = {
        readAsText: vi.fn(),
        result: JSON.stringify(mockSettings),
        onload: null,
        onerror: null,
      };

      global.FileReader = vi.fn(function (this: FileReader) {
        return mockFileReader as FileReader;
      }) as unknown as typeof FileReader;
    });

    it('should create FileReader instance', () => {
      importSettings(mockFile, onSuccessSpy, onErrorSpy);

      expect(FileReader).toHaveBeenCalled();
    });

    it('should read file as text', () => {
      importSettings(mockFile, onSuccessSpy, onErrorSpy);

      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);
    });

    it('should call onSuccess with parsed settings on valid JSON', () => {
      importSettings(mockFile, onSuccessSpy, onErrorSpy);

      // Simulate successful file read
      mockFileReader.onload?.call(
        mockFileReader as FileReader,
        {
          target: { result: JSON.stringify(mockSettings) },
        } as ProgressEvent<FileReader>
      );

      expect(onSuccessSpy).toHaveBeenCalledWith(mockSettings);
      expect(onErrorSpy).not.toHaveBeenCalled();
    });

    it('should call onError with message on invalid JSON', () => {
      importSettings(mockFile, onSuccessSpy, onErrorSpy);

      // Simulate file read with invalid JSON
      mockFileReader.onload?.call(
        mockFileReader as FileReader,
        {
          target: { result: 'invalid json' },
        } as ProgressEvent<FileReader>
      );

      expect(onErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ошибка при импорте настроек')
      );
      expect(onSuccessSpy).not.toHaveBeenCalled();
    });

    it('should call onError when result is not a string', () => {
      importSettings(mockFile, onSuccessSpy, onErrorSpy);

      // Simulate file read with non-string result
      mockFileReader.onload?.call(
        mockFileReader as FileReader,
        {
          target: { result: null },
        } as ProgressEvent<FileReader>
      );

      expect(onErrorSpy).toHaveBeenCalledWith('Неверный формат файла');
      expect(onSuccessSpy).not.toHaveBeenCalled();
    });

    it('should call onError on file read error', () => {
      importSettings(mockFile, onSuccessSpy, onErrorSpy);

      // Simulate file read error
      mockFileReader.onerror?.call(mockFileReader as FileReader, {} as ProgressEvent<FileReader>);

      expect(onErrorSpy).toHaveBeenCalledWith('Не удалось прочитать файл');
      expect(onSuccessSpy).not.toHaveBeenCalled();
    });

    it('should handle partial settings object', () => {
      const partialSettings = {
        testNumber: 'TEST-002',
        workingPressure: 75.0,
      };

      importSettings(mockFile, onSuccessSpy, onErrorSpy);

      mockFileReader.onload?.call(
        mockFileReader as FileReader,
        {
          target: { result: JSON.stringify(partialSettings) },
        } as ProgressEvent<FileReader>
      );

      expect(onSuccessSpy).toHaveBeenCalledWith(partialSettings);
    });

    it('should handle empty object', () => {
      importSettings(mockFile, onSuccessSpy, onErrorSpy);

      mockFileReader.onload?.call(
        mockFileReader as FileReader,
        {
          target: { result: '{}' },
        } as ProgressEvent<FileReader>
      );

      expect(onSuccessSpy).toHaveBeenCalledWith({});
    });

    it('should include error message in onError callback', () => {
      importSettings(mockFile, onSuccessSpy, onErrorSpy);

      mockFileReader.onload?.call(
        mockFileReader as FileReader,
        {
          target: { result: '{invalid}' },
        } as ProgressEvent<FileReader>
      );

      const errorMessage = onErrorSpy.mock.calls[0][0];
      expect(errorMessage).toContain('Ошибка при импорте настроек');
    });
  });
});
