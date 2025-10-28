# Alternative Fix for React Error #185

If the current fix doesn't work, use this approach with zustand shallow comparison:

```tsx
// GraphCanvas.tsx
import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useTestStore } from '../../store/useTestStore';
import { useThemeStore } from '../../store/useThemeStore';
import { generatePressureData } from '../../utils/graphGenerator';
import { renderGraph } from '../../utils/canvasRenderer';

export const GraphCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use shallow comparison to avoid unnecessary re-renders
  const settings = useTestStore(
    (state) => ({
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
    }),
    shallow
  );

  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Generate graph data
    const graphData = generatePressureData(settings);

    // Get container width
    const containerWidth = container.clientWidth;
    const aspectRatio = 1123 / 794;
    const width = containerWidth;
    const height = width / aspectRatio;

    // Render graph
    renderGraph(canvas, graphData, settings, {
      width,
      height,
      scale: 2,
      theme,
    });
  }, [settings, theme]);

  return (
    // ... same as before
  );
};
```

This approach uses Zustand's `shallow` function which does shallow comparison of the object,
preventing infinite loops while still detecting real changes.
