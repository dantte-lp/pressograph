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

  // Extract individual values to avoid object recreation
  const testNumber = useTestStore((state) => state.testNumber);
  const startDate = useTestStore((state) => state.startDate);
  const startTime = useTestStore((state) => state.startTime);
  const endDate = useTestStore((state) => state.endDate);
  const endTime = useTestStore((state) => state.endTime);
  const testDuration = useTestStore((state) => state.testDuration);
  const workingPressure = useTestStore((state) => state.workingPressure);
  const maxPressure = useTestStore((state) => state.maxPressure);
  const temperature = useTestStore((state) => state.temperature);
  const pressureDuration = useTestStore((state) => state.pressureDuration);
  const graphTitle = useTestStore((state) => state.graphTitle);
  const showInfo = useTestStore((state) => state.showInfo);
  const date = useTestStore((state) => state.date);
  const pressureTests = useTestStore((state) => state.pressureTests);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Create settings object
    const settings = {
      testNumber,
      startDate,
      startTime,
      endDate,
      endTime,
      testDuration,
      workingPressure,
      maxPressure,
      temperature,
      pressureDuration,
      graphTitle,
      showInfo,
      date,
      pressureTests,
    };

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
  }, [
    testNumber,
    startDate,
    startTime,
    endDate,
    endTime,
    testDuration,
    workingPressure,
    maxPressure,
    temperature,
    pressureDuration,
    graphTitle,
    showInfo,
    date,
    pressureTests,
    theme,
  ]);

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
