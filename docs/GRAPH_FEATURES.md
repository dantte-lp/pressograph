# Graph Features Documentation

Comprehensive guide to Pressograph 2.0 graph visualization and export features.

## Table of Contents

- [Overview](#overview)
- [Export Quality Options](#export-quality-options)
- [Realistic Pressure Drift Simulation](#realistic-pressure-drift-simulation)
- [Canvas-Style Visualization](#canvas-style-visualization)
- [Reference Line Toggles](#reference-line-toggles)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)

## Overview

Pressograph 2.0 provides professional-grade pressure test visualization with:

- **High-resolution export** (HD/4K/8K)
- **Realistic simulation** (Brownian motion + Gaussian noise)
- **Professional styling** (matching original Canvas implementation)
- **Configurable display** (show/hide reference lines)

All features maintain A4 Landscape format and follow ECharts best practices.

## Export Quality Options

### Available Presets

| Preset | Display Resolution | Pixel Ratio | Effective Resolution | Use Case |
|--------|-------------------|-------------|---------------------|----------|
| **HD** | 1920 × 1080 | 2x | 3840 × 2160 | Standard reports, presentations |
| **4K** | 3840 × 2160 | 2x | 7680 × 4320 | Professional documents, large displays |
| **8K** | 7680 × 4320 | 2x | 15360 × 8640 | Ultra high-resolution printing |

### Key Features

- **16:9 Aspect Ratio** - Wide format for professional presentations
- **No Scaling Artifacts** - Renders at native resolution using dedicated ECharts instance
- **Print-Ready** - White background, crisp lines
- **Proper Memory Management** - Disposes instances after export

### How to Use

1. Navigate to test detail page (`/tests/[id]`)
2. Click "Export Graph (ECharts)" button
3. Select desired quality from dropdown
4. Configure reference lines (optional)
5. Click "Export PNG" to download

### Implementation

```typescript
const EXPORT_QUALITY_PRESETS = {
  HD: { width: 1920, height: 1080, pixelRatio: 2 },
  '4K': { width: 3840, height: 2160, pixelRatio: 2 },
  '8K': { width: 7680, height: 4320, pixelRatio: 2 },
} as const;

// Create dedicated export instance
const exportChart = echarts.init(container, undefined, {
  width: preset.width,
  height: preset.height,
  devicePixelRatio: preset.pixelRatio,
});
```

## Realistic Pressure Drift Simulation

### Overview

Simulates high-precision pressure sensor behavior with natural variations, matching the original Pressograph v1.0 Canvas implementation.

### Simulation Components

#### 1. Brownian Motion (Drift)

- **Purpose**: Natural pressure drift over time
- **Magnitude**: ±0.2% typical (configurable)
- **Behavior**: Random walk with soft boundaries
- **Restoring Force**: Prevents unbounded growth

```typescript
// Brownian motion example
const brownian = new BrownianMotion(0.002, random);
brownian.step(); // Advance random walk
const drift = brownian.getValue(); // Get current drift
```

#### 2. Gaussian Noise

- **Purpose**: Measurement variations
- **Magnitude**: ±0.1% typical (configurable)
- **Distribution**: Normal (Gaussian) via Box-Muller transform
- **Applied to**: Each individual data point

```typescript
// Gaussian noise generation
function generateGaussian(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = random.next();
  const u2 = random.next();
  return mean + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * stdDev;
}
```

#### 3. High-Frequency Sampling

- **Default**: 1 second intervals
- **Configurable**: Any sampling rate
- **Purpose**: Realistic sensor data density

### Configuration Options

```typescript
interface DriftConfig {
  driftMagnitude?: number;  // ±% as decimal (default: 0.002)
  noiseMagnitude?: number;  // ±% as decimal (default: 0.001)
  samplingRate?: number;    // seconds (default: 1)
  seed?: number;            // for reproducible results
}
```

### Usage Example

```typescript
import { generateDriftPoints, generateRampPoints } from '@/lib/utils/pressure-drift-simulator';

// Hold period with drift
const holdPoints = generateDriftPoints(
  startTime,     // milliseconds
  endTime,       // milliseconds
  basePressure,  // target pressure
  {
    driftMagnitude: 0.002,  // ±0.2%
    noiseMagnitude: 0.001,  // ±0.1%
    samplingRate: 1,        // 1 second
  }
);

// Ramp transition with smooth S-curve
const rampPoints = generateRampPoints(
  startTime,
  endTime,
  startPressure,
  endPressure,
  { samplingRate: 1 }
);
```

### Visual Characteristics

**Original Canvas (Reference):**
```
Pressure (MPa)
   15 |           ╱‾‾‾‾‾‾‾╲
      |          /         \
   10 |  ╱‾‾‾‾‾╱           ╲‾‾‾‾╲
      | /                        \
    5 |/                          ╲
      |____________________________|
      0        10        20        30
              Time (hours)
```

**With Drift Simulation:**
```
Pressure (MPa)
   15 |           ╱‾~‾~‾~‾╲
      |          /~  ~  ~  \
   10 |  ╱~‾~‾~╱     ~      ╲~‾~‾╲
      | /~ ~ ~                ~ ~ \
    5 |/  ~                     ~  ╲
      |____________________________|
      0        10        20        30
              Time (hours)
```

Note the subtle variations (represented by ~) that simulate real sensor behavior.

## Canvas-Style Visualization

### Overview

ECharts styling configured to match the original Pressograph v1.0 Canvas implementation for visual consistency.

### Extracted Specifications

#### Colors

```typescript
// Light theme (default)
{
  bg: '#ffffff',                          // White background
  text: '#000000',                        // Black text
  grid: '#d0d0d0',                        // Primary grid
  gridLight: '#f0f0f0',                   // Secondary grid
  pressureLine: '#0066cc',                // Canvas blue
  pressureArea: 'rgba(173, 216, 230, 0.3)' // Light sky blue
}

// Dark theme
{
  bg: '#2d2d2d',                          // Dark gray background
  text: '#e0e0e0',                        // Light gray text
  grid: '#444444',                        // Primary grid
  gridLight: '#383838',                   // Secondary grid
  pressureLine: '#0066cc',                // Same blue
  pressureArea: 'rgba(173, 216, 230, 0.3)' // Same area color
}
```

#### Grid Layout

```typescript
{
  left: 80,    // Y-axis label space
  right: 50,   // Right margin
  top: 80,     // Title space
  bottom: 120, // X-axis label and info space
}
```

#### Typography

```typescript
{
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
  },
  axisLabel: {
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
  },
}
```

#### Line Styling

```typescript
{
  type: 'line',
  smooth: false,           // Sharp corners (Canvas behavior)
  symbol: 'none',          // No markers
  sampling: 'lttb',        // Optimize for many points
  lineStyle: {
    color: '#0066cc',
    width: 2,
    type: 'solid',
  },
  areaStyle: {
    color: 'rgba(173, 216, 230, 0.3)',
  },
}
```

### Usage

```typescript
import { applyCanvasStyle, getCanvasStyleOption } from '@/lib/utils/echarts-canvas-style';

// Method 1: Apply to existing option
const styledOption = applyCanvasStyle(myChartOption, 'light');

// Method 2: Start with Canvas template
const option = getCanvasStyleOption('My Chart Title', 'light');
// ... add series data
```

## Reference Line Toggles

### Overview

Control visibility of Working Pressure and Max Pressure reference lines in both preview and export.

### Features

- **Independent Control** - Toggle each line separately
- **Preview + Export** - Settings apply to both
- **Visual Feedback** - Status displayed in export details
- **Backward Compatible** - Default: both lines shown

### UI Components

#### Export Dialog

```tsx
<Checkbox
  checked={showWorkingLine}
  onCheckedChange={setShowWorkingLine}
  label="Show Working Pressure Line"
/>

<Checkbox
  checked={showMaxLine}
  onCheckedChange={setShowMaxLine}
  label="Show Max Pressure Line"
/>
```

#### Status Display

```
Reference Lines: Both | Working Only | Max Only | None
```

### Component Props

```typescript
interface GraphProps {
  // ... other props
  showWorkingLine?: boolean;  // default: true
  showMaxLine?: boolean;      // default: true
}
```

### Implementation

```typescript
markLine: {
  data: [
    ...(showWorkingLine ? [{
      yAxis: workingPressure,
      lineStyle: { color: '#10b981', type: 'dashed' },
      label: { formatter: `Working: ${workingPressure} MPa` }
    }] : []),
    ...(showMaxLine ? [{
      yAxis: maxPressure,
      lineStyle: { color: '#ef4444', type: 'dashed' },
      label: { formatter: `Max: ${maxPressure} MPa` }
    }] : []),
  ]
}
```

## Usage Examples

### Example 1: Basic Export with 4K Quality

```tsx
// Component usage
<EChartsExportDialog
  testNumber="PT-2025-001"
  testName="Pipeline Pressure Test"
  config={{
    workingPressure: 10,
    maxPressure: 15,
    testDuration: 24,
    pressureUnit: 'MPa',
    // ... other config
  }}
/>

// User workflow:
// 1. Click "Export Graph (ECharts)"
// 2. Select "4K UHD (2160p)" from dropdown
// 3. Both reference lines shown by default
// 4. Click "Export PNG"
// Result: 3840×2160 @ 2x = 7680×4320 effective pixels
```

### Example 2: Custom Preview with Drift

```tsx
import { PressureTestPreview } from '@/components/tests/pressure-test-preview';

<PressureTestPreview
  workingPressure={10}
  maxPressure={15}
  testDuration={24}
  pressureUnit="MPa"
  enableDrift={true}              // Enable realistic simulation
  showWorkingLine={true}
  showMaxLine={false}             // Hide max line
  startDateTime="2025-11-03T00:00:00Z"
  endDateTime="2025-11-04T00:00:00Z"
/>
```

### Example 3: Programmatic Data Generation

```typescript
import {
  generateRealisticTestData,
  convertToMinutes,
} from '@/lib/utils/pressure-drift-simulator';

const testConfig = {
  startTime: Date.now(),
  endTime: Date.now() + 24 * 60 * 60 * 1000, // +24 hours
  workingPressure: 10,
  intermediateStages: [
    {
      startTime: Date.now() + 8 * 60 * 60 * 1000,   // +8 hours
      endTime: Date.now() + 10 * 60 * 60 * 1000,    // +10 hours
      pressure: 12,
    },
  ],
};

const driftConfig = {
  driftMagnitude: 0.002,  // ±0.2%
  noiseMagnitude: 0.001,  // ±0.1%
  samplingRate: 1,        // 1 second
  seed: 12345,            // Reproducible
};

// Generate realistic data
const dataPoints = generateRealisticTestData(testConfig, driftConfig);

// Convert to minutes for ECharts
const chartData = convertToMinutes(dataPoints, testConfig.startTime);

// Use in ECharts series
series: [{
  type: 'line',
  data: chartData, // [[minutes, pressure], ...]
}]
```

### Example 4: Apply Canvas Styling

```typescript
import { applyCanvasStyle } from '@/lib/utils/echarts-canvas-style';

// Your ECharts option
const myOption = {
  xAxis: { type: 'value', name: 'Time' },
  yAxis: { type: 'value', name: 'Pressure' },
  series: [{ type: 'line', data: myData }],
};

// Apply Canvas styling
const styledOption = applyCanvasStyle(myOption, 'light');

// Chart will now match Canvas appearance
chart.setOption(styledOption);
```

## API Reference

### Pressure Drift Simulator

#### `generateDriftPoints(startTime, endTime, basePressure, config?)`

Generate data points with drift and noise for hold periods.

**Parameters:**
- `startTime: number` - Start time in milliseconds
- `endTime: number` - End time in milliseconds
- `basePressure: number` - Target pressure to maintain
- `config?: DriftConfig` - Optional configuration

**Returns:** `Array<[number, number]>` - Array of [time, pressure] points

**Example:**
```typescript
const points = generateDriftPoints(
  Date.now(),
  Date.now() + 3600000, // +1 hour
  10, // 10 MPa
  { samplingRate: 1 }
);
```

#### `generateRampPoints(startTime, endTime, startPressure, endPressure, config?)`

Generate smooth transition points for pressure ramps.

**Parameters:**
- `startTime: number` - Start time in milliseconds
- `endTime: number` - End time in milliseconds
- `startPressure: number` - Starting pressure
- `endPressure: number` - Target pressure
- `config?: DriftConfig` - Optional configuration

**Returns:** `Array<[number, number]>` - Array of [time, pressure] points

**Example:**
```typescript
const ramp = generateRampPoints(
  Date.now(),
  Date.now() + 30000, // +30 seconds
  0,  // Start at 0
  10, // Ramp to 10 MPa
  { samplingRate: 0.5 } // Sample every 0.5 seconds
);
```

#### `generateRealisticTestData(testConfig, driftConfig?)`

Generate complete realistic test data with all stages.

**Parameters:**
- `testConfig: TestDataConfig` - Test configuration
- `driftConfig?: DriftConfig` - Optional drift configuration

**Returns:** `Array<[number, number]>` - Complete test data

**Example:**
```typescript
const data = generateRealisticTestData(
  {
    startTime: Date.now(),
    endTime: Date.now() + 24 * 3600000,
    workingPressure: 10,
    intermediateStages: [
      { startTime: Date.now() + 8 * 3600000, endTime: Date.now() + 10 * 3600000, pressure: 12 }
    ]
  },
  { samplingRate: 1 }
);
```

### Canvas Style Configuration

#### `getLightThemeColors()` / `getDarkThemeColors()`

Get theme color configuration.

**Returns:** `CanvasThemeColors`

#### `getCanvasStyleOption(title, theme?)`

Get complete Canvas-styled ECharts option template.

**Parameters:**
- `title: string` - Chart title
- `theme?: 'light' | 'dark'` - Theme (default: 'light')

**Returns:** Complete ECharts option object

#### `applyCanvasStyle(option, theme?)`

Apply Canvas styling to existing ECharts option.

**Parameters:**
- `option: object` - Existing ECharts option
- `theme?: 'light' | 'dark'` - Theme (default: 'light')

**Returns:** Styled ECharts option

### Component Props

#### `<EChartsExportDialog>`

```typescript
interface EChartsExportDialogProps {
  testNumber: string;           // Test identifier
  testName: string;            // Test name
  config: PressureTestConfig;  // Complete test configuration
}
```

#### `<PressureTestPreview>`

```typescript
interface PressureTestPreviewProps {
  workingPressure: number;
  maxPressure: number;
  testDuration: number;
  intermediateStages?: IntermediateStage[];
  pressureUnit?: 'MPa' | 'Bar' | 'PSI';
  className?: string;
  startDateTime?: string;
  endDateTime?: string;
  showWorkingLine?: boolean;    // NEW: default true
  showMaxLine?: boolean;        // NEW: default true
  enableDrift?: boolean;        // NEW: default false
}
```

#### `<A4PreviewGraph>`

```typescript
interface A4PreviewGraphProps {
  workingPressure: number;
  maxPressure: number;
  testDuration: number;
  intermediateStages?: IntermediateStage[];
  pressureUnit?: 'MPa' | 'Bar' | 'PSI';
  startDateTime?: string;
  endDateTime?: string;
  paddingHours?: number;
  showWorkingLine?: boolean;    // NEW: default true
  showMaxLine?: boolean;        // NEW: default true
  enableDrift?: boolean;        // NEW: default false
}
```

## Performance Considerations

### Export Performance

- **HD Export**: ~0.5-1 second
- **4K Export**: ~1-2 seconds
- **8K Export**: ~3-5 seconds

Times vary based on data point count and system performance.

### Drift Simulation Performance

- **1 second sampling**: ~1000 points per 15-minute test
- **Sub-second sampling**: Proportionally more points
- **Recommendation**: Use 1-second sampling for most cases
- **LTTB Sampling**: ECharts automatically downsamples for display

### Memory Management

All export operations properly dispose ECharts instances:

```typescript
finally {
  if (exportChart) {
    exportChart.dispose();
    exportChart = null;
  }
}
```

## Browser Compatibility

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Canvas Support**: Required
- **High-Resolution Export**: All modern browsers
- **Memory**: 8K exports require ~500MB available memory

## Known Limitations

1. **Export File Size**
   - HD: ~500KB - 2MB
   - 4K: ~2MB - 8MB
   - 8K: ~8MB - 32MB

2. **Browser Limits**
   - Some browsers may limit canvas size
   - 8K export may fail on low-memory devices

3. **Drift Simulation**
   - High sampling rates increase file size
   - Very long tests (>72 hours) may need reduced sampling

## Future Enhancements

Planned features (not yet implemented):

- [ ] Time scale zoom parameter (interactive zoom levels)
- [ ] PDF export with multiple pages
- [ ] CSV data export with drift simulation
- [ ] Real-time drift preview toggle
- [ ] Custom color schemes
- [ ] Annotation support

## References

- Original Pressograph v1.0: `/opt/backup/pressograph-20251103-051742`
- ECharts Best Practices: `/docs/ECHARTS_BEST_PRACTICES.md`
- Component Documentation: Source file JSDoc comments

## Support

For issues or questions:
- Check CHANGELOG.md for recent changes
- Review source code JSDoc documentation
- Refer to ECharts official documentation for advanced customization

---

**Last Updated:** 2025-11-07
**Version:** Pressograph 2.0 (Unreleased)
