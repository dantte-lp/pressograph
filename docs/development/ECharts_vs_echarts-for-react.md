# ECharts vs echarts-for-react: детальный технический анализ для React-приложений

**Apache ECharts — мощная enterprise-grade библиотека визуализации, а echarts-for-react — популярная React-обертка, упрощающая интеграцию.** Для банковских приложений критически важно понимать архитектурные различия, стратегии оптимизации bundle size и best practices производственной разработки. Оба подхода жизнеспособны для enterprise-приложений, но требуют разных стратегий реализации.

Ключевое отличие: **echarts является peer dependency для echarts-for-react**, что дает разработчикам полный контроль над версией ядра библиотеки. Wrapper добавляет всего ~5-10 КБ накладных расходов, автоматизируя lifecycle management и обработку resize событий. При правильной настройке tree-shaking вы сможете сократить размер бандла на 50-60% (экономия ~400 КБ), что критично для production-приложений.

## Архитектурные различия между пакетами

### Что такое echarts-for-react и зачем он нужен

echarts-for-react — это React-специфичная обертка, созданная hustcc, которая решает **проблему несовместимости императивного API ECharts с декларативной парадигмой React**. Библиотека автоматизирует управление жизненным циклом chart instance, обработку resize событий и синхронизацию обновлений через React props.

**Ключевая архитектурная особенность:** echarts является **peer dependency**, а не прямой зависимостью echarts-for-react. Это означает:

```bash
# Необходимо устанавливать оба пакета отдельно
npm install --save echarts-for-react
npm install --save echarts
```

Такой подход дает:
- **Контроль версий**: выбирайте любую версию ECharts (v3.x - v6.x)
- **Избежание дублирования**: нет конфликтов при использовании echarts в других частях приложения
- **Гибкость tree-shaking**: возможность импортировать только нужные модули
- **Кастомные сборки**: поддержка собственных builds с выборочными компонентами

### Сравнение прямого использования echarts vs echarts-for-react

**Императивный подход (прямое использование echarts):**

```typescript
import React, { useRef, useEffect } from 'react';
import { init, getInstanceByDom } from 'echarts';

export const DirectEChart = ({ option, style }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ручная инициализация
    const chart = init(chartRef.current);
    
    // Ручная привязка событий
    chart.on('click', (params) => console.log(params));
    
    // Ручная обработка resize
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    
    // КРИТИЧНО: ручная очистка
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose(); // Освобождение памяти
    };
  }, []);

  // Отдельный effect для обновления опций
  useEffect(() => {
    const chart = getInstanceByDom(chartRef.current);
    chart.setOption(option);
  }, [option]);

  return <div ref={chartRef} style={style} />;
};
```

**Проблемы императивного подхода:**
- Требуется явное управление жизненным циклом (mount/update/unmount)
- Необходимость вручную обрабатывать window resize events
- Риск утечек памяти при неправильной очистке
- Более сложная логика сравнения props для оптимизации
- Дополнительный boilerplate код для каждого компонента

**Декларативный подход (echarts-for-react):**

```typescript
import ReactECharts from 'echarts-for-react';

export const WrappedEChart = ({ option, style }) => {
  return <ReactECharts option={option} style={style} />;
};
```

**Преимущества wrapper-подхода:**
- Декларативный React-style API (просто передаете props)
- Автоматическое управление lifecycle через React компонент
- Встроенная обработка resize с использованием библиотеки size-sensor
- Оптимизированные обновления через PureComponent
- Упрощенная привязка событий через `onEvents` prop

### Внутренний механизм работы echarts-for-react

Wrapper реализован как class component, расширяющий PureComponent:

```typescript
// Упрощенная архитектура из src/core.tsx
export default class EChartsReactCore extends PureComponent<EChartsReactProps> {
  public ele: HTMLElement;        // Контейнер DOM
  private echarts: any;           // Ссылка на библиотеку echarts
  
  // MOUNT: Инициализация при монтировании
  public async componentDidMount() {
    await this.initEchartsInstance();
    this.bindEvents();
    bind(this.ele, () => this.resize()); // Автоматический resize
    this.props.onChartReady?.(this.getEchartsInstance());
  }
  
  // UPDATE: Обновление при изменении props
  public componentDidUpdate(prevProps) {
    const { option, notMerge, replaceMerge, lazyUpdate } = this.props;
    
    if (!isEqual(prevProps.option, option)) {
      this.getEchartsInstance().setOption(option, {
        notMerge,
        replaceMerge,
        lazyUpdate
      });
    }
    
    if (!isEqual(prevProps.onEvents, this.props.onEvents)) {
      this.rebindEvents(); // Переподключение событий
    }
  }
  
  // UNMOUNT: Очистка при размонтировании
  public componentWillUnmount() {
    clear(this.ele); // Удаление size-sensor
    this.getEchartsInstance()?.dispose(); // Уничтожение chart
  }
}
```

**Ключевые паттерны проектирования:**
1. **Facade Pattern**: упрощение сложного ECharts API
2. **Adapter Pattern**: адаптация императивного API к декларативной модели React
3. **Observer Pattern**: использование size-sensor для автоматического resize
4. **Dependency Injection**: принимает echarts как prop (в Core варианте)
5. **Proxy Pattern**: предоставляет `getEchartsInstance()` для прямого доступа

### Две версии компонента

```typescript
// Вариант 1: Полная версия (проще, но больше размер бандла)
import ReactECharts from 'echarts-for-react';

function SimpleChart() {
  return <ReactECharts option={option} />;
}

// Вариант 2: Core версия (tree-shaking, меньше размер)
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, GridComponent, CanvasRenderer]);

function OptimizedChart() {
  return <ReactEChartsCore echarts={echarts} option={option} />;
}
```

## React integration patterns и управление жизненным циклом

### Обработка re-renders и обновлений ECharts

**Как React re-renders влияют на ECharts обновления:**

```typescript
// Родительский компонент
function PressureTestDashboard() {
  const [testData, setTestData] = useState([]);
  
  // КРИТИЧНО: мемоизация option объекта
  const chartOption = useMemo(() => ({
    title: { text: 'Pressure Test Results' },
    xAxis: { type: 'category', data: testData.map(d => d.timestamp) },
    yAxis: { type: 'value', name: 'TPS' },
    series: [{
      type: 'line',
      data: testData.map(d => d.value),
      smooth: true,
      sampling: 'lttb' // Large Time/Value Buckets для оптимизации
    }]
  }), [testData]); // Пересоздается ТОЛЬКО при изменении testData
  
  return <ReactECharts option={chartOption} />;
}
```

**Режимы обновления setOption():**

```typescript
// Merge mode (по умолчанию): объединяет с предыдущими настройками
<ReactECharts 
  option={newOption}
  notMerge={false} // Merge с существующей конфигурацией
/>

// notMerge mode: полная замена конфигурации
<ReactECharts 
  option={newOption}
  notMerge={true} // Полностью заменяет старый option
/>

// lazyUpdate: отложенное обновление для частых изменений
<ReactECharts 
  option={newOption}
  lazyUpdate={true} // Throttling обновлений
/>
```

### Memory management и предотвращение утечек памяти

**Критичные сценарии утечек памяти в банковских приложениях:**

**Сценарий 1: React 18 Strict Mode (двойная инициализация в dev режиме)**

```typescript
// ❌ ПРОБЛЕМА: создание нескольких instances
useEffect(() => {
  const chart = echarts.init(chartRef.current);
  // В React 18 dev mode выполнится дважды!
}, []);

// ✅ РЕШЕНИЕ: проверка существующего instance
useEffect(() => {
  let chart = echarts.getInstanceByDom(chartRef.current);
  if (!chart) {
    chart = echarts.init(chartRef.current);
  }
  
  return () => chart?.dispose();
}, []);
```

**Сценарий 2: Накопление event listeners**

```typescript
// ❌ ПРОБЛЕМА: listeners не удаляются
useEffect(() => {
  const chart = getInstanceByDom(chartRef.current);
  window.addEventListener('resize', () => chart.resize());
  // Missing cleanup!
}, [option]); // Re-runs при каждом изменении option

// ✅ РЕШЕНИЕ: правильная очистка
useEffect(() => {
  const chart = getInstanceByDom(chartRef.current);
  const handleResize = () => chart.resize();
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []); // Запускается ОДИН раз
```

**Сценарий 3: Debounced функции и async операции**

```typescript
import { debounce } from 'lodash';

function PressureTestChart({ option, style = {} }) {
  const chartRef = useRef(null);

  const resizeChart = useMemo(
    () => debounce(() => {
      if (chartRef.current) {
        const chart = getInstanceByDom(chartRef.current);
        chart?.resize();
      }
    }, 50),
    []
  );

  useEffect(() => {
    const chart = init(chartRef.current);
    
    const resizeObserver = new ResizeObserver(() => resizeChart());
    resizeObserver.observe(chartRef.current);

    // КРИТИЧНО: очистка ALL ресурсов
    return () => {
      chart?.dispose();              // 1. Уничтожение chart
      if (chartRef.current) {
        resizeObserver.unobserve(chartRef.current);
      }
      resizeObserver.disconnect();   // 2. Отключение observer
      resizeChart.cancel();          // 3. Отмена pending debounced вызовов
    };
  }, []);

  return <div ref={chartRef} style={style} />;
}
```

### Когда использовать каждый подход

**Используйте ПРЯМУЮ ИНТЕГРАЦИЮ, если:**

✅ **Нужен максимальный контроль над chart lifecycle**
```typescript
const chart = init(chartRef.current, 'dark', {
  renderer: 'svg',
  width: 800,
  height: 600,
  locale: 'RU' // Локализация для банковского приложения
});
```

✅ **Критична минимизация bundle size**
```typescript
// Импорт ТОЛЬКО необходимых модулей
import * as echarts from 'echarts/core';
import { LineChart, CandlestickChart } from 'echarts/charts';
import { GridComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, CandlestickChart, GridComponent, DataZoomComponent, CanvasRenderer]);
```

✅ **Требуется продвинутая манипуляция instance**
```typescript
useEffect(() => {
  const chart = getInstanceByDom(chartRef.current);
  
  chart.showLoading('Загрузка данных тестирования...');
  
  fetchPressureTestData().then(data => {
    chart.setOption(processData(data));
    chart.hideLoading();
  });
}, []);
```

✅ **TypeScript проект с строгой типизацией**
```typescript
import type { EChartsOption, ECharts } from 'echarts';

interface PressureChartProps {
  option: EChartsOption;
  style?: React.CSSProperties;
}

export const PressureChart: React.FC<PressureChartProps> = ({ option, style }) => {
  // Полная type safety
};
```

**Используйте ECHARTS-FOR-REACT, если:**

✅ **Быстрое прототипирование и стандартные use cases**
```typescript
<ReactECharts option={option} /> // Работает сразу из коробки
```

✅ **Команда предпочитает декларативный component API**
```typescript
<ReactECharts
  option={option}
  theme="dark"
  showLoading={isLoadingData}
  loadingOption={{ text: 'Загрузка...' }}
  onEvents={{ click: handleChartClick }}
  autoResize={true} // Автоматический resize
/>
```

✅ **Не хотите управлять lifecycle вручную**

✅ **Legacy кодовая база уже использует wrapper**

## Tree-shaking и оптимизация bundle size

### Сравнение размеров bundle

**Полный импорт (без tree-shaking):**
- **ECharts full**: ~354 КБ (gzipped), ~814 КБ (parsed)
- **echarts-for-react + full ECharts**: ~793-888 КБ (parsed)
- **Real-world impact**: один из случаев показал main.js размером 1.1-1.2 МБ

**С правильным tree-shaking:**
- **Минимальный bundle** (single chart type): ~407 КБ (parsed)
- **Экономия**: ~400 КБ (~50% reduction)
- **Реальный кейс**: команда сократила bundle с 4 МБ до приемлемых размеров

**Overhead echarts-for-react:** ~5-10 КБ (минимальный)

### Правильная настройка tree-shaking для банковского приложения

**Шаг 1: Использование Core компонента**

```typescript
// components/charts/OptimizedChart.tsx
import React from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';

// Импорт ТОЛЬКО нужных типов графиков
import {
  LineChart,
  BarChart,
  CandlestickChart  // Для финансовых данных
} from 'echarts/charts';

// Импорт ТОЛЬКО необходимых компонентов
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,    // Для масштабирования временных рядов
  LegendComponent,
  ToolboxComponent      // Для экспорта
} from 'echarts/components';

// Выбор рендерера (Canvas для больших данных)
import { CanvasRenderer } from 'echarts/renderers';

// Регистрация компонентов ONE TIME
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  ToolboxComponent,
  LineChart,
  BarChart,
  CandlestickChart,
  CanvasRenderer
]);

export function PressureTestChart({ option }) {
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge={true}
      lazyUpdate={true}
      style={{ height: '600px', width: '100%' }}
    />
  );
}
```

**Шаг 2: TypeScript типизация для tree-shaken imports**

```typescript
import type { ComposeOption } from 'echarts/core';
import type {
  LineSeriesOption,
  BarSeriesOption,
  CandlestickSeriesOption
} from 'echarts/charts';
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  DataZoomComponentOption,
  LegendComponentOption
} from 'echarts/components';

// Compose ТОЛЬКО используемые типы
export type PressureTestChartOption = ComposeOption<
  | LineSeriesOption
  | BarSeriesOption
  | CandlestickSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | DataZoomComponentOption
  | LegendComponentOption
>;

// Type-safe использование
const chartOption: PressureTestChartOption = {
  title: { text: 'Pressure Test Results' },
  tooltip: { trigger: 'axis' },
  // ...
};
```

**Шаг 3: Webpack/Vite конфигурация**

```javascript
// vite.config.js (для Vite)
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'echarts-core': ['echarts/core'],
          'echarts-charts': ['echarts/charts'],
          'echarts-components': ['echarts/components']
        }
      }
    }
  }
};

// webpack.config.js (для Webpack)
module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,      // Включить tree-shaking
    sideEffects: true,
    minimize: true
  },
  resolve: {
    mainFields: ['module', 'main'] // Предпочитать ES modules
  }
};
```

### Стратегии минимизации bundle size

**Стратегия 1: Удалите неиспользуемые features**

```typescript
// ❌ НЕ импортируйте, если не используете:
// - UniversalTransition (если нет анимаций между типами графиков)
// - LabelLayout (если нет оптимизации расположения labels)
// - DatasetComponent (если используете прямые series data)
// - SVGRenderer (если используете только Canvas)

// ✅ Минимальный импорт для line chart
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);
// Результат: ~150-200 КБ (parsed) вместо ~800 КБ
```

**Стратегия 2: Code splitting для chart-heavy приложений**

```typescript
// Ленивая загрузка компонентов с графиками
const PressureTestDashboard = React.lazy(() => 
  import('./components/PressureTestDashboard')
);

function App() {
  return (
    <Suspense fallback={<div>Загрузка визуализации...</div>}>
      <PressureTestDashboard />
    </Suspense>
  );
}
```

**Стратегия 3: Используйте официальный Code Generator**

ECharts предоставляет вкладку "Full Code" в примерах, которая автоматически генерирует tree-shakeable код на основе конфигурации графика.

### Результаты оптимизации в реальных проектах

| Конфигурация | Размер Bundle (Parsed) | Примечания |
|-------------|----------------------|-----------|
| Full echarts import | 793-888 КБ | Все charts/components |
| Tree-shaken (single chart) | 407 КБ | Только bar chart |
| Tree-shaken (multi-chart) | 500-600 КБ | 3-4 типа графиков |
| Minimal (bar + components) | 150-200 КБ | Estimated |

**Документированные кейсы:**
- Кейс 1: сокращение с 1.2 МБ до ~700 КБ (41% reduction)
- Кейс 2: удалено 4 МБ из bundle через tree-shaking
- Кейс 3: с 793 КБ до 407 КБ (48.7% reduction)

## Advanced features для production использования

### Event handling для интерактивных дашбордов

**Основные события для pressure test visualization:**

```typescript
import ReactECharts from 'echarts-for-react';
import { useState, useCallback } from 'react';

function InteractivePressureChart() {
  const [selectedPoint, setSelectedPoint] = useState(null);
  
  const handleChartClick = useCallback((params) => {
    console.log('Выбранная точка:', {
      timestamp: params.name,
      value: params.value,
      seriesIndex: params.seriesIndex
    });
    setSelectedPoint(params.dataIndex);
  }, []);
  
  const handleDataZoom = useCallback((params) => {
    console.log('Zoom изменен:', {
      startValue: params.batch[0].startValue,
      endValue: params.batch[0].endValue
    });
    // Загрузка дополнительных данных для выбранного временного окна
  }, []);
  
  const handleLegendChange = useCallback((params) => {
    console.log('Legend изменен:', params.selected);
  }, []);
  
  const onEvents = {
    'click': handleChartClick,
    'datazoom': handleDataZoom,
    'legendselectchanged': handleLegendChange,
    'mouseover': (params) => console.log('Hover:', params),
    'mouseout': () => console.log('Mouse out')
  };
  
  const option = {
    title: { text: 'Результаты нагрузочного тестирования' },
    tooltip: { 
      trigger: 'axis',
      formatter: (params) => {
        // Кастомный tooltip для банковского приложения
        const dataPoint = params[0];
        return `
          <strong>Время:</strong> ${dataPoint.name}<br/>
          <strong>TPS:</strong> ${dataPoint.value}<br/>
          <strong>Status:</strong> ${dataPoint.value > threshold ? 'OK' : 'Warning'}
        `;
      }
    },
    xAxis: { 
      type: 'category',
      data: timestamps,
      triggerEvent: true // Включает события для axis labels
    },
    yAxis: { type: 'value', name: 'Transactions/sec' },
    dataZoom: [
      { type: 'slider', start: 0, end: 100 },
      { type: 'inside' }
    ],
    series: [{
      type: 'line',
      data: testResults,
      itemStyle: {
        color: (params) => params.dataIndex === selectedPoint ? '#ff0000' : '#5470c6'
      }
    }]
  };
  
  return (
    <ReactECharts
      option={option}
      onEvents={onEvents}
      style={{ height: '600px' }}
    />
  );
}
```

**Клик по пустой области (используя zrender):**

```typescript
import { useRef, useEffect } from 'react';

function ChartWithBlankAreaClick() {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (chartRef.current) {
      const instance = chartRef.current.getEchartsInstance();
      
      // Обработка кликов по пустой области
      instance.getZr().on('click', (event) => {
        if (!event.target) {
          console.log('Клик по пустой области - сброс selection');
          setSelectedPoint(null);
        }
      });
    }
  }, []);
  
  return <ReactECharts ref={chartRef} option={option} />;
}
```

### Programmatic updates и доступ к instance методам

**Доступ к ECharts instance для продвинутых операций:**

```typescript
import { useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

function AdvancedPressureChart() {
  const chartRef = useRef<InstanceType<typeof ReactECharts>>(null);
  
  useEffect(() => {
    if (chartRef.current) {
      const instance = chartRef.current.getEchartsInstance();
      
      // 1. Получение data URL для экспорта
      const exportChart = () => {
        const dataURL = instance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff'
        });
        downloadImage(dataURL, 'pressure-test-report.png');
      };
      
      // 2. Programmatic resize
      const resizeChart = () => {
        instance.resize({ width: 1200, height: 800 });
      };
      
      // 3. Show/hide loading
      const loadData = async () => {
        instance.showLoading('default', {
          text: 'Загрузка данных нагрузочного тестирования...',
          color: '#c23531',
          textColor: '#000',
          maskColor: 'rgba(255, 255, 255, 0.8)'
        });
        
        const data = await fetchPressureTestData();
        instance.setOption({ series: [{ data }] });
        instance.hideLoading();
      };
      
      // 4. Dispatch actions (programmatic highlight/tooltip)
      const highlightDataPoint = (dataIndex: number) => {
        instance.dispatchAction({
          type: 'highlight',
          seriesIndex: 0,
          dataIndex: dataIndex
        });
        
        instance.dispatchAction({
          type: 'showTip',
          seriesIndex: 0,
          dataIndex: dataIndex
        });
      };
      
      // 5. Координатная конвертация (для custom overlays)
      const getPixelPosition = (dataPoint: [number, number]) => {
        return instance.convertToPixel('grid', dataPoint);
      };
      
      // 6. Получение текущей конфигурации
      const getCurrentOption = () => {
        return instance.getOption();
      };
    }
  }, []);
  
  return (
    <div>
      <ReactECharts 
        ref={chartRef}
        option={option}
        style={{ height: '600px' }}
      />
      <button onClick={() => exportChart()}>Экспорт в PNG</button>
      <button onClick={() => loadData()}>Загрузить данные</button>
    </div>
  );
}
```

### TypeScript support и type safety

**Полная типизация для банковского приложения:**

```typescript
import React, { useRef, useEffect, CSSProperties } from 'react';
import { init, getInstanceByDom } from 'echarts';
import type { ECharts, EChartsOption, SetOptionOpts } from 'echarts';

// Интерфейс для props
interface BankingChartProps {
  option: EChartsOption;
  style?: CSSProperties;
  settings?: SetOptionOpts;
  loading?: boolean;
  theme?: 'light' | 'dark';
  onChartReady?: (instance: ECharts) => void;
}

// Type-safe React компонент
export const BankingChart: React.FC<BankingChartProps> = ({
  option,
  style,
  settings,
  loading = false,
  theme = 'light',
  onChartReady
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  // Инициализация с type safety
  useEffect(() => {
    let chart: ECharts | undefined;
    
    if (chartRef.current) {
      chart = init(chartRef.current, theme, {
        renderer: 'canvas',
        width: undefined,
        height: undefined
      });
      
      onChartReady?.(chart);
    }

    const resizeChart = () => chart?.resize();
    window.addEventListener('resize', resizeChart);

    return () => {
      chart?.dispose();
      window.removeEventListener('resize', resizeChart);
    };
  }, [theme, onChartReady]);

  // Обновление опций
  useEffect(() => {
    if (chartRef.current) {
      const chart = getInstanceByDom(chartRef.current);
      chart?.setOption(option, settings);
    }
  }, [option, settings]);

  // Обработка loading state
  useEffect(() => {
    if (chartRef.current) {
      const chart = getInstanceByDom(chartRef.current);
      if (loading) {
        chart?.showLoading();
      } else {
        chart?.hideLoading();
      }
    }
  }, [loading]);

  return (
    <div 
      ref={chartRef} 
      style={{ width: '100%', height: '600px', ...style }} 
    />
  );
};
```

**Type-safe option с tree-shaking:**

```typescript
import type { ComposeOption } from 'echarts/core';
import type { LineSeriesOption } from 'echarts/charts';
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption
} from 'echarts/components';

// Строгая типизация ТОЛЬКО для используемых компонентов
type PressureTestOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
>;

const option: PressureTestOption = {
  title: { text: 'Нагрузочное тестирование' },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['10:00', '10:05', '10:10'] },
  yAxis: { type: 'value' },
  series: [{
    type: 'line',
    data: [1200, 1500, 1800]
  }]
};
```

### Темная/светлая тема для банковского приложения

**Динамическое переключение темы (ECharts v6.0+):**

```typescript
import { useState, useEffect, useRef } from 'react';
import { init, dispose, getInstanceByDom } from 'echarts';

function ThemedPressureChart() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Уничтожаем старый instance
      const existingChart = getInstanceByDom(chartRef.current);
      if (existingChart) {
        dispose(chartRef.current);
      }

      // Создаем с новой темой
      const chart = init(chartRef.current, theme);
      
      chart.setOption({
        title: { text: 'Результаты тестирования' },
        // ... остальная конфигурация
      });
    }
  }, [theme]);
  
  // Синхронизация с system theme
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      setTheme(darkModeQuery.matches ? 'dark' : 'light');
    };
    
    updateTheme(); // Инициализация
    darkModeQuery.addEventListener('change', updateTheme);
    
    return () => darkModeQuery.removeEventListener('change', updateTheme);
  }, []);

  return (
    <div>
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Переключить тему
      </button>
      <div ref={chartRef} style={{ width: '100%', height: '600px' }} />
    </div>
  );
}
```

**Кастомная банковская тема:**

```typescript
import echarts from 'echarts';

// Регистрация корпоративной темы банка
echarts.registerTheme('corporate_bank', {
  backgroundColor: '#f5f7fa',
  textStyle: {
    color: '#1a1a1a',
    fontFamily: 'Inter, -apple-system, sans-serif'
  },
  color: [
    '#0052cc', // Основной синий банка
    '#00875a', // Success зеленый
    '#de350b', // Warning красный
    '#5243aa', // Фиолетовый
    '#00b8d9'  // Голубой
  ],
  legend: {
    textStyle: { color: '#42526e' }
  },
  title: {
    textStyle: {
      color: '#172b4d',
      fontWeight: 600
    }
  }
});

// Использование
const chart = echarts.init(
  document.getElementById('main'),
  'corporate_bank'
);
```

### Export functionality для отчетов

**Полная реализация экспорта для банковских отчетов:**

```typescript
import jsPDF from 'jspdf';
import { useRef } from 'react';
import ReactECharts from 'echarts-for-react';

function ExportablePressureChart() {
  const chartRef = useRef<any>(null);
  
  // Экспорт в PNG с высоким качеством
  const exportAsPNG = () => {
    if (chartRef.current) {
      const instance = chartRef.current.getEchartsInstance();
      const url = instance.getDataURL({
        type: 'png',
        pixelRatio: 3, // 3x для retina displays
        backgroundColor: '#ffffff',
        excludeComponents: ['toolbox'] // Исключить UI элементы
      });
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `pressure-test-report-${new Date().toISOString()}.png`;
      link.click();
    }
  };
  
  // Экспорт в PDF с метаданными
  const exportAsPDF = () => {
    if (chartRef.current) {
      const instance = chartRef.current.getEchartsInstance();
      const imgData = instance.getDataURL({
        type: 'png',
        pixelRatio: 3,
        backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Добавляем метаданные
      pdf.setProperties({
        title: 'Отчет о нагрузочном тестировании',
        subject: 'Performance Testing Results',
        author: 'Banking IT Department',
        keywords: 'pressure test, performance, banking',
        creator: 'ECharts Report Generator'
      });
      
      // Добавляем header
      pdf.setFontSize(16);
      pdf.text('Отчет о нагрузочном тестировании', 15, 15);
      
      pdf.setFontSize(10);
      pdf.text(`Дата: ${new Date().toLocaleString('ru-RU')}`, 15, 22);
      
      // Добавляем график
      pdf.addImage(imgData, 'PNG', 15, 30, 270, 150);
      
      // Сохраняем
      pdf.save(`pressure-test-report-${Date.now()}.pdf`);
    }
  };
  
  // Встроенная toolbox с сохранением
  const option = {
    toolbox: {
      feature: {
        saveAsImage: {
          type: 'png',
          name: `pressure-test-${Date.now()}`,
          backgroundColor: '#fff',
          pixelRatio: 2,
          title: 'Сохранить изображение',
          excludeComponents: ['toolbox']
        },
        dataView: {
          title: 'Просмотр данных',
          lang: ['Данные', 'Закрыть', 'Обновить']
        },
        restore: { title: 'Сбросить' },
        dataZoom: { title: { zoom: 'Зум', back: 'Назад' } }
      }
    },
    // ... остальная конфигурация
  };
  
  return (
    <div>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height: '600px', width: '100%' }}
      />
      <div style={{ marginTop: '10px' }}>
        <button onClick={exportAsPNG}>Экспорт PNG</button>
        <button onClick={exportAsPDF}>Экспорт PDF</button>
      </div>
    </div>
  );
}
```

## Актуальность, maintenance и community support

### Статус поддержки библиотек

**Apache ECharts (Core):**
- **GitHub stars**: 64,900+
- **Текущая версия**: v6.0.0 (November 2025)
- **Статус**: ✅ **ОТЛИЧНЫЙ** - очень активная разработка
- **Управление**: Apache Software Foundation (гарантия долгосрочной поддержки)
- **Загрузки**: ~1,284,000/неделю (NPM)
- **Использование**: GitLab, Grafana, 296+ компаний

**echarts-for-react (Wrapper):**
- **GitHub stars**: 4,900+
- **Текущая версия**: v3.0.5 (November 6, 2025 - недавно обновлена)
- **Статус**: ⚠️ **ХОРОШИЙ** - недавно возобновлена активная разработка
- **Загрузки**: ~403,000/неделю (NPM)
- **Dependents**: 601 пакетов

**Важно**: были опасения по поводу maintenance echarts-for-react (последнее крупное обновление 3.0.2 было 4 года назад), но выпуск версий 3.0.4-3.0.5 в ноябре 2025 показывает возобновление активной разработки.

### Версионная совместимость

**Модель peer dependency:**
- echarts-for-react поддерживает ECharts v3.x, v4.x, v5.x, v6.x
- Разработчики выбирают версию echarts независимо
- Полная совместимость с tree-shaking через `ReactEChartsCore`

**Миграция между версиями:**
- ECharts v5 → v6: минимальные breaking changes, есть migration guide
- Можно использовать `echarts/theme/v5.js` для сохранения v5 визуального стиля в v6
- TypeScript definitions встроены (не нужен @types/echarts)

### Рекомендации для банковского React-приложения

**Для production-приложения в банке рекомендуется:**

**Вариант 1: Кастомная обертка (РЕКОМЕНДУЕТСЯ для критичных приложений)**
```typescript
// lib/charts/useEChart.ts - Собственный хук
import { useRef, useEffect } from 'react';
import { init, getInstanceByDom } from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';

export function useEChart(
  option: EChartsOption,
  config?: { theme?: string; renderer?: 'canvas' | 'svg' }
) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      const chart = init(chartRef.current, config?.theme, {
        renderer: config?.renderer || 'canvas'
      });
      instanceRef.current = chart;

      const resizeObserver = new ResizeObserver(() => chart.resize());
      resizeObserver.observe(chartRef.current);

      return () => {
        resizeObserver.disconnect();
        chart.dispose();
      };
    }
  }, [config?.theme, config?.renderer]);

  useEffect(() => {
    instanceRef.current?.setOption(option);
  }, [option]);

  return { chartRef, instance: instanceRef.current };
}

// Использование
function BankingDashboard() {
  const { chartRef, instance } = useEChart(chartOption, { theme: 'dark' });
  
  return <div ref={chartRef} style={{ height: '600px' }} />;
}
```

**Преимущества кастомной обертки:**
- Полный контроль над реализацией
- Лучшее понимание integration points
- Проще расширить для специфичных нужд банка
- Не зависит от maintenance третьих сторон
- Можно адаптировать для корпоративных стандартов

**Вариант 2: echarts-for-react (РЕКОМЕНДУЕТСЯ для большинства случаев)**
```typescript
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
// ... tree-shaken imports

function StandardBankingChart() {
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge={true}
      lazyUpdate={true}
    />
  );
}
```

**Преимущества echarts-for-react:**
- Быстрая разработка
- Хорошо протестирован в production
- Активное community (601 dependents)
- Недавно обновлен (v3.0.5 - November 2025)

### Best practices для банковского приложения

**1. Управление версиями и безопасность:**
```json
// package.json - Фиксируйте версии
{
  "dependencies": {
    "echarts": "6.0.0",
    "echarts-for-react": "3.0.5"
  }
}
```

**2. Bundle optimization:**
- Используйте tree-shaking обязательно
- Импортируйте ТОЛЬКО нужные chart types
- Выберите один renderer (Canvas ИЛИ SVG)
- Используйте webpack-bundle-analyzer для мониторинга

**3. Performance для больших датасетов:**
```typescript
const option = {
  series: [{
    type: 'line',
    data: largeDataset,
    progressive: 2000,          // Рендер по 2000 точек
    progressiveThreshold: 3000, // Включить при data > 3000
    sampling: 'lttb',          // Lossless sampling algorithm
    large: true,               // Оптимизация для больших данных
    largeThreshold: 2000       // Порог для large mode
  }]
};
```

**4. Security considerations:**
- Санитизация user-provided data перед рендерингом
- Регулярные security audits dependencies
- Мониторинг CVE через npm audit
- Self-hosting для полного контроля (no CDN dependencies)

**5. Compliance и audit trail:**
```typescript
// Логирование экспорта для compliance
const exportChart = () => {
  const dataURL = instance.getDataURL({ ... });
  
  // Audit log
  logAuditEvent({
    action: 'CHART_EXPORT',
    userId: currentUser.id,
    timestamp: new Date(),
    chartType: 'pressure_test',
    exportFormat: 'png'
  });
  
  downloadImage(dataURL);
};
```

## Практические примеры для pressure test visualization

### Полный пример: Real-time pressure test dashboard

```typescript
// components/PressureTestDashboard.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  ToolboxComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  ToolboxComponent,
  CanvasRenderer
]);

interface PressureTestDataPoint {
  timestamp: string;
  tps: number;
  responseTime: number;
  errorRate: number;
}

export function PressureTestDashboard() {
  const [data, setData] = useState<PressureTestDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<any>(null);

  // Real-time data fetching
  useEffect(() => {
    const ws = new WebSocket('wss://your-bank-api.com/pressure-test-stream');
    
    ws.onmessage = (event) => {
      const newDataPoint = JSON.parse(event.data);
      setData(prev => [...prev.slice(-100), newDataPoint]); // Keep last 100 points
    };
    
    ws.onopen = () => setIsLoading(false);
    
    return () => ws.close();
  }, []);

  // Memoized chart option
  const chartOption = useMemo(() => ({
    title: {
      text: 'Результаты нагрузочного тестирования',
      subtext: 'Real-time мониторинг производительности',
      left: 'center',
      textStyle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 20,
        fontWeight: 600
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        const timestamp = params[0].name;
        return `
          <div style="padding: 8px;">
            <strong>${timestamp}</strong><br/>
            ${params.map((p: any) => `
              <span style="color: ${p.color}">●</span> 
              ${p.seriesName}: ${p.value}
            `).join('<br/>')}
          </div>
        `;
      }
    },
    legend: {
      data: ['TPS', 'Response Time (ms)', 'Error Rate (%)'],
      top: 40
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    toolbox: {
      feature: {
        dataZoom: { yAxisIndex: 'none' },
        restore: {},
        saveAsImage: {
          name: `pressure-test-${Date.now()}`,
          pixelRatio: 2
        }
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => d.timestamp)
    },
    yAxis: [
      {
        type: 'value',
        name: 'TPS',
        position: 'left',
        axisLabel: { formatter: '{value}' }
      },
      {
        type: 'value',
        name: 'Response Time (ms)',
        position: 'right',
        axisLabel: { formatter: '{value} ms' }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ],
    series: [
      {
        name: 'TPS',
        type: 'line',
        yAxisIndex: 0,
        data: data.map(d => d.tps),
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.3 }
      },
      {
        name: 'Response Time (ms)',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(d => d.responseTime),
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2 }
      },
      {
        name: 'Error Rate (%)',
        type: 'line',
        yAxisIndex: 0,
        data: data.map(d => d.errorRate),
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, type: 'dashed' },
        itemStyle: { color: '#de350b' }
      }
    ]
  }), [data]);

  const onEvents = {
    click: (params: any) => {
      console.log('Выбрана точка:', params);
    },
    datazoom: (params: any) => {
      console.log('Zoom изменен:', params);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={chartOption}
        notMerge={true}
        lazyUpdate={true}
        showLoading={isLoading}
        loadingOption={{
          text: 'Загрузка данных...',
          color: '#0052cc',
          textColor: '#000',
          maskColor: 'rgba(255, 255, 255, 0.8)'
        }}
        onEvents={onEvents}
        style={{ height: '600px', width: '100%' }}
      />
    </div>
  );
}
```

## Итоговые рекомендации для банка

### Матрица принятия решений

| Критерий | Прямое использование echarts | echarts-for-react | Кастомная обертка |
|----------|----------------------------|-------------------|-------------------|
| **Скорость разработки** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Контроль implementation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Bundle size** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Простота maintenance** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **TypeScript support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Community support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

### Финальная рекомендация

**Для вашего банковского Canvas-based pressure test visualization приложения:**

**Рекомендую начать с echarts-for-react (ReactEChartsCore + tree-shaking):**

1. **Быстрый старт миграции** - позволит быстро перенести существующую Canvas визуализацию
2. **Production-ready** - проверено в enterprise-окружении (GitLab, Grafana, 601 dependents)
3. **Недавно обновлен** - v3.0.5 (November 2025) показывает активное развитие
4. **Хорошая производительность** - overhead всего ~5-10 КБ
5. **Tree-shaking support** - сэкономите ~400 КБ bundle size

**С миграцией на кастомную обертку через 3-6 месяцев**, если:
- Потребуется более тонкий контроль
- Команда хорошо изучит ECharts API
- Появятся специфичные требования банка

**Пошаговый план внедрения:**

```bash
# Week 1: Setup
npm install echarts@6.0.0 echarts-for-react@3.0.5
# Настройка tree-shaking, создание базового компонента

# Week 2-3: Migration
# Перенос Canvas визуализации на ECharts
# Реализация основных features

# Week 4: Optimization
# Bundle size optimization через tree-shaking
# Performance tuning для больших датасетов

# Week 5-6: Production
# Security audit, accessibility review
# Documentation, deployment
```

**Версии для production:**
- `echarts: 6.0.0` (последняя стабильная)
- `echarts-for-react: 3.0.5` (недавно обновлена)
- Фиксируйте версии в package.json
- Настройте dependabot для security updates

**Риск-оценка: НИЗКИЙ** - обе библиотеки подходят для production использования в банковских приложениях при соблюдении best practices и регулярном обслуживании.