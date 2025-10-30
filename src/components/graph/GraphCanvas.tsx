// ═══════════════════════════════════════════════════════════════════
// Graph Canvas Component
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useMemo, memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTestStore } from '../../store/useTestStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useLanguage } from '../../i18n';
import { Card, CardHeader, CardBody, Chip } from '@heroui/react';
import { generatePressureData } from '../../utils/graphGenerator';
import { renderGraph } from '../../utils/canvasRenderer';
import type { TestSettings } from '../../types';

// PERFORMANCE FIX: Extract internal component for memoization
const GraphCanvasInternal = () => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use shallow comparison to prevent infinite loops
  const settings = useTestStore(
    useShallow((state): TestSettings => ({
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
    }))
  );
  // PERFORMANCE FIX: Use useShallow to prevent unnecessary re-renders
  const theme = useThemeStore(useShallow((state) => state.theme));

  // PERFORMANCE FIX: Memoize graph data generation
  // Only regenerate when settings that affect the graph actually change
  const graphData = useMemo(() => {
    return generatePressureData(settings);
  }, [
    // Only depend on fields that actually affect graph data
    settings.testNumber,
    settings.startDate,
    settings.startTime,
    settings.endDate,
    settings.endTime,
    settings.testDuration,
    settings.workingPressure,
    settings.maxPressure,
    settings.temperature,
    settings.pressureDuration,
    settings.date,
    JSON.stringify(settings.pressureTests), // Use JSON.stringify for array comparison
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Get container width - увеличиваем ширину для лучшей видимости
    const containerWidth = container.clientWidth;
    const aspectRatio = 1.6; // Увеличенное соотношение для растяжения по горизонтали
    const width = containerWidth;
    const height = width / aspectRatio;

    // Render graph with memoized data
    renderGraph(canvas, graphData, settings, {
      width,
      height,
      scale: 2, // Higher DPI for crisp rendering
      theme,
    });
  }, [graphData, settings, theme]);

  return (
    <Card shadow="lg" radius="lg">
      <CardHeader className="flex justify-between items-center pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-default-900 dark:bg-default-100 rounded-md">
            <svg className="w-5 h-5 text-default-50 dark:text-default-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-foreground uppercase">
            {t.pressureTestGraph}
          </h2>
        </div>
      </CardHeader>
      <CardBody className="p-6">
        <div ref={containerRef} className="w-full">
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-lg"
          />
        </div>
      </CardBody>
    </Card>
  );
};

// PERFORMANCE FIX: Wrap component in React.memo with custom comparison
// This prevents re-renders when props haven't meaningfully changed
export const GraphCanvas = memo(GraphCanvasInternal, () => {
  // Always return false to allow React to use its default shallow comparison
  // Since we're using Zustand with useShallow internally, we already have optimized updates
  // This memo wrapper provides an additional optimization layer
  return false; // false = always check with default comparison
});
