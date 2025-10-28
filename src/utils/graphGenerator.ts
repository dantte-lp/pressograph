// ═══════════════════════════════════════════════════════════════════
// Graph Data Generation Logic
// ═══════════════════════════════════════════════════════════════════

import toast from 'react-hot-toast';
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
 * Генерация точек с контролируемым дрейфом давления
 */
const generateDriftPoints = (
  startTime: Date,
  endTime: Date,
  startPressure: number,
  endPressure: number,
  pointsCount: number = 20
): DataPoint[] => {
  const result: DataPoint[] = [];
  const timeStep = (endTime.getTime() - startTime.getTime()) / pointsCount;
  const pressureStep = (endPressure - startPressure) / pointsCount;

  for (let i = 0; i <= pointsCount; i++) {
    const time = new Date(startTime.getTime() + timeStep * i);
    const basePressure = startPressure + pressureStep * i;
    const noisyPressure = addNoise(basePressure);
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
    toast.error('Дата окончания должна быть позже даты начала', {
      duration: 5000,
      position: 'top-center',
    });
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

  // Сброс давления (30 секунд) - по умолчанию до 0
  const dropTime = new Date(holdEnd.getTime() + 30 * 1000);
  for (let i = 0; i <= 5; i++) {
    const t = holdEnd.getTime() + (30 * 1000 * i) / 5;
    const p = workingPressure * (1 - i / 5) + (i < 5 ? (Math.random() - 0.5) * 2 : 0);
    points.push({ time: new Date(t), pressure: Math.max(0, p) });
  }

  let lastDropTime = dropTime;
  let lastDropPressure = 0;

  // Промежуточные опрессовки
  const sortedTests = [...pressureTests].sort((a, b) => a.time - b.time);

  sortedTests.forEach((test: PressureTest, index: number) => {
    const testStart = new Date(startDateTime.getTime() + test.time * 60 * 60 * 1000);
    const testPressure = test.pressure ?? workingPressure;
    const dropTarget = test.targetPressure ?? 0;

    // Определяем конечное давление удержания (если есть holdDrift)
    const nextTest = sortedTests[index + 1];
    const holdEndPressure = lastDropPressure + (test.holdDrift ?? 0);

    // Период удержания давления до опрессовки (с дрейфом если есть)
    const holdDuration = testStart.getTime() - lastDropTime.getTime();
    if (holdDuration > 60 * 1000) { // Больше 1 минуты
      const pointsCount = Math.max(10, Math.floor(holdDuration / (60 * 60 * 1000)) * 2);

      if (test.holdDrift !== undefined && test.holdDrift !== 0) {
        // Контролируемый дрейф
        const driftPoints = generateDriftPoints(
          lastDropTime,
          new Date(testStart.getTime() - 30 * 1000),
          lastDropPressure,
          holdEndPressure,
          pointsCount
        );
        points.push(...driftPoints);
      } else {
        // Стабильное удержание с небольшим шумом
        const lowPressurePoints = generateIntermediatePoints(
          lastDropTime,
          new Date(testStart.getTime() - 30 * 1000),
          lastDropPressure,
          pointsCount
        );
        points.push(...lowPressurePoints);
      }
    }

    // Подъем давления (30 секунд)
    const currentPressure = test.holdDrift !== undefined ? holdEndPressure : lastDropPressure;
    for (let i = 0; i <= 5; i++) {
      const t = testStart.getTime() - 30 * 1000 + (30 * 1000 * i) / 5;
      const p = currentPressure + ((testPressure - currentPressure) * i) / 5 + (i > 0 ? (Math.random() - 0.5) * 2 : 0);
      points.push({ time: new Date(t), pressure: Math.max(0, p) });
    }

    // Удержание давления с контролируемым дрейфом
    const testHold = new Date(testStart.getTime() + test.duration * 60 * 1000);

    if (test.minPressure !== undefined || test.maxPressure !== undefined) {
      // Дрейф во время удержания
      const targetHoldPressure = test.minPressure ?? test.maxPressure ?? testPressure;
      const testHoldPoints = generateDriftPoints(testStart, testHold, testPressure, targetHoldPressure, 15);
      points.push(...testHoldPoints);
    } else {
      // Стабильное удержание
      const testHoldPoints = generateIntermediatePoints(testStart, testHold, testPressure, 15);
      points.push(...testHoldPoints);
    }

    // Сброс давления (30 секунд) до targetPressure
    const testDropTime = new Date(testHold.getTime() + 30 * 1000);
    const finalHoldPressure = test.minPressure ?? test.maxPressure ?? testPressure;

    for (let i = 0; i <= 5; i++) {
      const t = testHold.getTime() + (30 * 1000 * i) / 5;
      const p = finalHoldPressure * (1 - i / 5) + dropTarget * (i / 5) + (i < 5 ? (Math.random() - 0.5) * 2 : 0);
      points.push({ time: new Date(t), pressure: Math.max(0, p) });
    }

    lastDropTime = testDropTime;
    lastDropPressure = dropTarget;
  });

  // Финальный период низкого давления
  const finalDuration = endDateTime.getTime() - lastDropTime.getTime();
  if (finalDuration > 60 * 1000) { // Больше 1 минуты
    const finalPointsCount = Math.max(10, Math.floor(finalDuration / (60 * 60 * 1000)) * 2);
    const finalLowPressurePoints = generateIntermediatePoints(
      lastDropTime,
      endDateTime,
      lastDropPressure,
      finalPointsCount
    );
    points.push(...finalLowPressurePoints);
  }

  // Конечная точка - сброс до 0
  if (lastDropPressure > 0) {
    // Финальный сброс до 0 (30 секунд)
    const finalDropTime = new Date(endDateTime.getTime() - 30 * 1000);
    for (let i = 0; i <= 5; i++) {
      const t = finalDropTime.getTime() + (30 * 1000 * i) / 5;
      const p = lastDropPressure * (1 - i / 5) + (i < 5 ? (Math.random() - 0.5) * 0.5 : 0);
      points.push({ time: new Date(t), pressure: Math.max(0, p) });
    }
  }

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
