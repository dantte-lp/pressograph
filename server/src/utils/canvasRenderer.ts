// ═══════════════════════════════════════════════════════════════════
// Canvas Rendering Logic for Pressure Test Graph (Backend)
// ═══════════════════════════════════════════════════════════════════

import { createCanvas, Canvas, registerFont } from 'canvas';
import type { GraphData, TestSettings } from '../types/graph.types';
import { formatDateTime } from './helpers';

// Register DejaVu Sans font for Cyrillic support
// Font is installed in Docker container via fonts-dejavu-core package
// This fixes the issue where Russian text shows as squares in PNG exports
try {
  registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', {
    family: 'DejaVu Sans',
  });
  registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', {
    family: 'DejaVu Sans',
    weight: 'bold',
  });
} catch (error) {
  console.warn('Warning: Could not register DejaVu Sans font. Cyrillic text may not display correctly:', error);
}

type Theme = 'light' | 'dark';

interface CanvasConfig {
  width: number;
  height: number;
  scale: number;
  theme: Theme;
}

interface Colors {
  bg: string;
  text: string;
  grid: string;
  gridLight: string;
  infoBoxBg: string;
  infoBoxBorder: string;
}

const getColors = (theme: Theme): Colors => {
  if (theme === 'dark') {
    return {
      bg: '#2d2d2d',
      text: '#e0e0e0',
      grid: '#444',
      gridLight: '#383838',
      infoBoxBg: 'rgba(56, 56, 56, 0.9)',
      infoBoxBorder: '#555',
    };
  }
  return {
    bg: 'white',
    text: 'black',
    grid: '#d0d0d0',
    gridLight: '#f0f0f0',
    infoBoxBg: 'rgba(255, 248, 220, 0.9)',
    infoBoxBorder: '#ddd',
  };
};

/**
 * Renders a pressure test graph to a canvas and returns PNG buffer
 * @param graphData - Generated graph data points
 * @param settings - Test settings for rendering
 * @param config - Canvas configuration (size, theme)
 * @returns PNG buffer of the rendered graph
 */
export const renderGraph = (
  graphData: GraphData,
  settings: TestSettings,
  config: CanvasConfig
): Buffer => {
  const { width, height, scale, theme } = config;
  const { points, startDateTime, endDateTime } = graphData;
  const { workingPressure, maxPressure, graphTitle, testNumber, temperature, date, showInfo } = settings;

  // Create canvas (node-canvas creates new Canvas objects)
  const displayWidth = width;
  const displayHeight = height;
  const canvas = createCanvas(displayWidth * scale, displayHeight * scale);
  const ctx = canvas.getContext('2d');

  ctx.scale(scale, scale);

  const colors = getColors(theme);

  // Очистка canvas
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  // Параметры графика
  const margin = { top: 80, right: 50, bottom: 120, left: 80 };
  const graphWidth = displayWidth - margin.left - margin.right;
  const graphHeight = displayHeight - margin.top - margin.bottom;

  // Добавляем запас времени (5% с каждой стороны)
  const timeRange = endDateTime.getTime() - startDateTime.getTime();
  const timeBuffer = timeRange * 0.05;
  const graphStartTime = new Date(startDateTime.getTime() - timeBuffer);
  const graphEndTime = new Date(endDateTime.getTime() + timeBuffer);
  const graphTimeRange = graphEndTime.getTime() - graphStartTime.getTime();

  // Масштабирование давления
  const pressureMaxRaw = maxPressure * 1.1;
  const pressureMax = Math.ceil(pressureMaxRaw / 5) * 5;

  const xScale = (time: number) => {
    return margin.left + ((time - graphStartTime.getTime()) / graphTimeRange) * graphWidth;
  };

  const yScale = (pressure: number) => {
    return margin.top + graphHeight - (pressure / pressureMax) * graphHeight;
  };

  // Заголовок
  ctx.font = 'bold 20px "DejaVu Sans", Arial, sans-serif';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.fillText(graphTitle, displayWidth / 2, 40);

  // Рисование осей
  ctx.strokeStyle = colors.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + graphHeight);
  ctx.lineTo(margin.left + graphWidth, margin.top + graphHeight);
  ctx.stroke();

  // Сетка по Y
  ctx.strokeStyle = colors.gridLight;
  ctx.lineWidth = 1;
  const gridStep = 5;
  const numSteps = Math.ceil(pressureMax / gridStep);

  for (let i = 0; i <= numSteps; i++) {
    const pressure = i * gridStep;
    if (pressure <= pressureMax) {
      const y = yScale(pressure);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + graphWidth, y);
      ctx.stroke();
    }
  }

  // Подписи оси Y
  ctx.font = '12px "DejaVu Sans", Arial, sans-serif';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'right';

  for (let i = 0; i <= numSteps; i++) {
    const pressure = i * gridStep;
    if (pressure <= pressureMax) {
      const y = yScale(pressure);
      ctx.fillText(pressure.toFixed(0), margin.left - 10, y + 5);
    }
  }

  // Подпись оси Y
  ctx.save();
  ctx.translate(20, displayHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = '14px "DejaVu Sans", Arial, sans-serif';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.fillText('Давление, МПа', 0, 0);
  ctx.restore();

  // Сетка по X
  const testDuration = settings.testDuration;
  const timeInterval = testDuration <= 30 ? 2 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000;

  const gridStartTime = new Date(graphStartTime);
  gridStartTime.setMinutes(0, 0, 0);
  const intervalHours = timeInterval / (60 * 60 * 1000);
  gridStartTime.setHours(Math.floor(gridStartTime.getHours() / intervalHours) * intervalHours);

  if (gridStartTime > graphStartTime) {
    gridStartTime.setHours(gridStartTime.getHours() - intervalHours);
  }

  ctx.font = '11px "DejaVu Sans", Arial, sans-serif';
  ctx.textAlign = 'center';

  for (
    let time = gridStartTime.getTime();
    time <= graphEndTime.getTime() + timeInterval;
    time += timeInterval
  ) {
    const x = xScale(time);
    if (x >= margin.left && x <= margin.left + graphWidth) {
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + graphHeight);
      ctx.stroke();

      const date = new Date(time);
      const timeStr = formatDateTime(date).split(' ');
      ctx.fillStyle = colors.text;
      ctx.fillText(timeStr[0], x, margin.top + graphHeight + 20);
      ctx.fillText(timeStr[1], x, margin.top + graphHeight + 35);
    }
  }

  // Мелкие деления (30 минут)
  const thirtyMinutes = 30 * 60 * 1000;
  ctx.strokeStyle = colors.gridLight;
  ctx.lineWidth = 0.5;
  for (
    let time = graphStartTime.getTime();
    time <= graphEndTime.getTime();
    time += thirtyMinutes
  ) {
    const x = xScale(time);
    if (x >= margin.left && x <= margin.left + graphWidth) {
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + graphHeight);
      ctx.stroke();
    }
  }

  // Насечки на оси времени
  ctx.strokeStyle = colors.text;
  ctx.lineWidth = 1;
  const oneHour = 60 * 60 * 1000;
  for (let time = gridStartTime.getTime(); time <= graphEndTime.getTime(); time += oneHour) {
    const x = xScale(time);
    if (x >= margin.left && x <= margin.left + graphWidth) {
      ctx.beginPath();
      ctx.moveTo(x, margin.top + graphHeight);
      ctx.lineTo(x, margin.top + graphHeight + 8);
      ctx.stroke();
    }
  }

  const tenMinutes = 10 * 60 * 1000;
  ctx.lineWidth = 0.5;
  for (let time = graphStartTime.getTime(); time <= graphEndTime.getTime(); time += tenMinutes) {
    const x = xScale(time);
    if (x >= margin.left && x <= margin.left + graphWidth) {
      const date = new Date(time);
      if (date.getMinutes() !== 0) {
        ctx.beginPath();
        ctx.moveTo(x, margin.top + graphHeight);
        ctx.lineTo(x, margin.top + graphHeight + 4);
        ctx.stroke();
      }
    }
  }

  // Подпись оси X
  ctx.font = 'bold 14px "DejaVu Sans", Arial, sans-serif';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.fillText('Время', displayWidth / 2, displayHeight - 60);

  // Проверка на наличие данных
  if (points.length === 0) {
    // Показываем сообщение об ошибке на графике
    ctx.fillStyle = colors.infoBoxBg;
    const errorBoxWidth = 400;
    const errorBoxHeight = 100;
    const errorBoxX = (displayWidth - errorBoxWidth) / 2;
    const errorBoxY = (displayHeight - errorBoxHeight) / 2;

    ctx.fillRect(errorBoxX, errorBoxY, errorBoxWidth, errorBoxHeight);
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.strokeRect(errorBoxX, errorBoxY, errorBoxWidth, errorBoxHeight);

    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 18px "DejaVu Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ Ошибка валидации', displayWidth / 2, errorBoxY + 35);

    ctx.fillStyle = colors.text;
    ctx.font = '14px "DejaVu Sans", Arial, sans-serif';
    ctx.fillText('Дата окончания должна быть позже даты начала', displayWidth / 2, errorBoxY + 60);
    ctx.fillText('Пожалуйста, исправьте даты в форме', displayWidth / 2, errorBoxY + 80);

    // Return PNG buffer even for error case
    return canvas.toBuffer('image/png');
  }

  // Рисование графика - заливка
  ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
  ctx.beginPath();
  ctx.moveTo(xScale(points[0].time.getTime()), yScale(0));
  for (const point of points) {
    ctx.lineTo(xScale(point.time.getTime()), yScale(point.pressure));
  }
  ctx.lineTo(xScale(points[points.length - 1].time.getTime()), yScale(0));
  ctx.closePath();
  ctx.fill();

  // Рисование графика - линия
  ctx.strokeStyle = '#0066cc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xScale(points[0].time.getTime()), yScale(points[0].pressure));
  for (const point of points) {
    ctx.lineTo(xScale(point.time.getTime()), yScale(point.pressure));
  }
  ctx.stroke();

  // Информационная панель
  if (showInfo === 'on') {
    ctx.fillStyle = colors.infoBoxBg;
    ctx.fillRect(margin.left + 10, margin.top + 10, 200, 80);
    ctx.strokeStyle = colors.infoBoxBorder;
    ctx.strokeRect(margin.left + 10, margin.top + 10, 200, 80);

    ctx.fillStyle = colors.text;
    ctx.font = '12px "DejaVu Sans", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Испытание №${testNumber}`, margin.left + 20, margin.top + 30);
    ctx.fillText(`Дата: ${date}`, margin.left + 20, margin.top + 45);
    ctx.fillText(`Рабочее давление: ${workingPressure} МПа`, margin.left + 20, margin.top + 60);
    ctx.fillText(`Температура: ${temperature}°C`, margin.left + 20, margin.top + 75);
  } else if (showInfo === 'under') {
    ctx.fillStyle = colors.text;
    ctx.font = '11px "DejaVu Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    // Информация под подписью "Время"
    const baseY = displayHeight - 45;
    ctx.fillText(`Испытание №${testNumber}`, displayWidth / 2, baseY);
    ctx.fillText(`Дата: ${date}`, displayWidth / 2, baseY + 12);
    ctx.fillText(`Рабочее давление: ${workingPressure} МПа | Температура: ${temperature}°C`, displayWidth / 2, baseY + 24);
  }

  // Return PNG buffer
  return canvas.toBuffer('image/png');
};
