// ═══════════════════════════════════════════════════════════════════
// Graph Data Generation Logic
// ═══════════════════════════════════════════════════════════════════

import type { DataPoint, GraphData, PressureTest, TestSettings } from '../types';
import { parseDateTime, addNoise } from './helpers';

/**
 * Генерация промежуточных точек с шумом
 */
const generateIntermediatePoints = (
  startTime: Date,
  endTime: Date,
  pressure: number,
  pointsCount: number = 10
): DataPoint[] => {
  const result: DataPoint[] = [];
  const timeStep = (endTime.getTime() - startTime.getTime()) / pointsCount;

  for (let i = 0; i <= pointsCount; i++) {
    const time = new Date(startTime.getTime() + timeStep * i);
    const noisyPressure = addNoise(pressure);
    result.push({ time, pressure: noisyPressure });
  }

  return result;
};

/**
 * Генерация данных о давлении для графика
 */
export const generatePressureData = (settings: TestSettings): GraphData => {
  const {
    startDate,
    startTime,
    endDate,
    endTime,
    workingPressure,
    pressureDuration,
    pressureTests,
  } = settings;

  const startDateTime = parseDateTime(startDate, startTime);
  const endDateTime = parseDateTime(endDate, endTime);

  const points: DataPoint[] = [];

  // Проверка валидности дат
  if (endDateTime <= startDateTime) {
    console.error('Дата окончания должна быть позже даты начала');
    return { points: [], startDateTime, endDateTime };
  }

  // Начальная точка
  points.push({ time: new Date(startDateTime), pressure: 0 });

  // Первый подъем давления (30 секунд)
  const riseTime = new Date(startDateTime.getTime() + 30 * 1000);
  for (let i = 0; i <= 5; i++) {
    const t = startDateTime.getTime() + (30 * 1000 * i) / 5;
    const p = (workingPressure * i) / 5 + (i > 0 ? (Math.random() - 0.5) * 2 : 0);
    points.push({ time: new Date(t), pressure: Math.max(0, p) });
  }

  // Удержание давления с флуктуациями
  const holdEnd = new Date(riseTime.getTime() + pressureDuration * 60 * 1000);
  const holdPoints = generateIntermediatePoints(riseTime, holdEnd, workingPressure, 20);
  points.push(...holdPoints);

  // Сброс давления (30 секунд)
  const dropTime = new Date(holdEnd.getTime() + 30 * 1000);
  for (let i = 0; i <= 5; i++) {
    const t = holdEnd.getTime() + (30 * 1000 * i) / 5;
    const p = workingPressure * (1 - i / 5) + (i < 5 ? (Math.random() - 0.5) * 2 : 0);
    points.push({ time: new Date(t), pressure: Math.max(0, p) });
  }

  let lastDropTime = dropTime;

  // Промежуточные опрессовки
  const sortedTests = [...pressureTests].sort((a, b) => a.time - b.time);

  sortedTests.forEach((test: PressureTest) => {
    const testStart = new Date(startDateTime.getTime() + test.time * 60 * 60 * 1000);

    // Период низкого давления до опрессовки
    const lowPressurePoints = generateIntermediatePoints(
      lastDropTime,
      new Date(testStart.getTime() - 30 * 1000),
      0,
      Math.floor((testStart.getTime() - lastDropTime.getTime()) / (60 * 60 * 1000)) * 2
    );
    points.push(...lowPressurePoints);

    // Подъем давления (30 секунд)
    for (let i = 0; i <= 5; i++) {
      const t = testStart.getTime() - 30 * 1000 + (30 * 1000 * i) / 5;
      const p = (workingPressure * i) / 5 + (i > 0 ? (Math.random() - 0.5) * 2 : 0);
      points.push({ time: new Date(t), pressure: Math.max(0, p) });
    }

    // Удержание давления
    const testHold = new Date(testStart.getTime() + test.duration * 60 * 1000);
    const testHoldPoints = generateIntermediatePoints(testStart, testHold, workingPressure, 15);
    points.push(...testHoldPoints);

    // Сброс давления (30 секунд)
    const testDropTime = new Date(testHold.getTime() + 30 * 1000);
    for (let i = 0; i <= 5; i++) {
      const t = testHold.getTime() + (30 * 1000 * i) / 5;
      const p = workingPressure * (1 - i / 5) + (i < 5 ? (Math.random() - 0.5) * 2 : 0);
      points.push({ time: new Date(t), pressure: Math.max(0, p) });
    }

    lastDropTime = testDropTime;
  });

  // Финальный период низкого давления
  const finalLowPressurePoints = generateIntermediatePoints(
    lastDropTime,
    endDateTime,
    0,
    Math.floor((endDateTime.getTime() - lastDropTime.getTime()) / (60 * 60 * 1000)) * 2
  );
  points.push(...finalLowPressurePoints);

  // Конечная точка
  points.push({ time: endDateTime, pressure: 0 });

  // Сортировка и удаление дубликатов
  points.sort((a, b) => a.time.getTime() - b.time.getTime());

  const uniquePoints: DataPoint[] = [];
  let lastTime: Date | null = null;

  for (const point of points) {
    if (!lastTime || point.time.getTime() !== lastTime.getTime()) {
      uniquePoints.push(point);
      lastTime = point.time;
    }
  }

  return { points: uniquePoints, startDateTime, endDateTime };
};
