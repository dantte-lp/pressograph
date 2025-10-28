// ═══════════════════════════════════════════════════════════════════
// Graph Canvas Component
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { useTestStore } from '../../store/useTestStore';
import { useThemeStore } from '../../store/useThemeStore';
import { generatePressureData } from '../../utils/graphGenerator';
import { renderGraph } from '../../utils/canvasRenderer';

export const GraphCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const settings = useTestStore((state) => ({
    testNumber: state.testNumber,
    startDate: state.startDate,
    startTime: state.startTime,
    endDate: state.endDate,
    endTime: state.endTime,
    testDuration: state.testDuration,
    workingPressure: state.workingPressure,
    maxPressure: state.maxPressure,
    temperature: state.temperature,
    pressureDuration: state.pressureDuration,
    graphTitle: state.graphTitle,
    showInfo: state.showInfo,
    date: state.date,
    pressureTests: state.pressureTests,
  }));
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Generate graph data
    const graphData = generatePressureData(settings);

    // Get container width
    const containerWidth = container.clientWidth;
    const aspectRatio = 1123 / 794; // Original aspect ratio
    const width = containerWidth;
    const height = width / aspectRatio;

    // Render graph
    renderGraph(canvas, graphData, settings, {
      width,
      height,
      scale: 2, // Higher DPI for crisp rendering
      theme,
    });
  }, [settings, theme]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Pressure Test Graph
      </h2>
      <div ref={containerRef} className="w-full">
        <canvas
          ref={canvasRef}
          className="w-full h-auto border border-gray-200 dark:border-gray-700 rounded"
        />
      </div>
    </div>
  );
};
