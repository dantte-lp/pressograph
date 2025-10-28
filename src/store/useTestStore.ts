// ═══════════════════════════════════════════════════════════════════
// Zustand Store for Test Settings
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TestSettings, PressureTest, PresetTemplate } from '../types';
import { generateId } from '../utils/helpers';

interface TestStore extends TestSettings {
  // Actions
  updateField: <K extends keyof TestSettings>(field: K, value: TestSettings[K]) => void;
  addPressureTest: () => void;
  removePressureTest: (id: string) => void;
  updatePressureTest: (id: string, field: keyof PressureTest, value: number) => void;
  loadPreset: (preset: PresetTemplate) => void;
  clearAllTests: () => void;
  importSettings: (settings: Partial<TestSettings>) => void;
  exportSettings: () => TestSettings;
  resetToDefaults: () => void;
}

const getDefaultSettings = (): TestSettings => ({
  testNumber: '20252401',
  startDate: '2025-01-23',
  startTime: '09:12:12',
  endDate: '2025-01-24',
  endTime: '00:32:10',
  testDuration: 15.33,
  workingPressure: 70,
  maxPressure: 72.71,
  temperature: 90,
  pressureDuration: 15,
  graphTitle: 'График испытания давления',
  showInfo: 'under',
  date: '2025-01-23',
  pressureTests: [
    { id: generateId(), time: 6, duration: 15 },
    { id: generateId(), time: 12, duration: 15 },
    { id: generateId(), time: 15, duration: 15 },
  ],
});

const presetTemplates: Record<PresetTemplate, Partial<TestSettings>> = {
  standard: {
    testDuration: 15.33,
    workingPressure: 70,
    maxPressure: 72.71,
    temperature: 90,
    pressureDuration: 15,
    pressureTests: [
      { id: generateId(), time: 6, duration: 15 },
      { id: generateId(), time: 12, duration: 15 },
      { id: generateId(), time: 15, duration: 15 },
    ],
  },
  daily: {
    testDuration: 24,
    workingPressure: 70,
    maxPressure: 75,
    temperature: 90,
    pressureDuration: 20,
    pressureTests: [
      { id: generateId(), time: 4, duration: 20 },
      { id: generateId(), time: 8, duration: 20 },
      { id: generateId(), time: 12, duration: 20 },
      { id: generateId(), time: 16, duration: 20 },
      { id: generateId(), time: 20, duration: 20 },
    ],
  },
  extended: {
    testDuration: 48,
    workingPressure: 65,
    maxPressure: 70,
    temperature: 85,
    pressureDuration: 30,
    pressureTests: [
      { id: generateId(), time: 6, duration: 30 },
      { id: generateId(), time: 12, duration: 30 },
      { id: generateId(), time: 18, duration: 30 },
      { id: generateId(), time: 24, duration: 30 },
      { id: generateId(), time: 30, duration: 30 },
      { id: generateId(), time: 36, duration: 30 },
      { id: generateId(), time: 42, duration: 30 },
    ],
  },
};

export const useTestStore = create<TestStore>()(
  persist(
    (set, get) => ({
      ...getDefaultSettings(),

      updateField: (field, value) => set({ [field]: value }),

      addPressureTest: () =>
        set((state) => ({
          pressureTests: [
            ...state.pressureTests,
            { id: generateId(), time: 0, duration: state.pressureDuration },
          ],
        })),

      removePressureTest: (id) =>
        set((state) => ({
          pressureTests: state.pressureTests.filter((test) => test.id !== id),
        })),

      updatePressureTest: (id, field, value) =>
        set((state) => ({
          pressureTests: state.pressureTests.map((test) =>
            test.id === id ? { ...test, [field]: value } : test
          ),
        })),

      loadPreset: (preset) => {
        const template = presetTemplates[preset];
        set((state) => ({
          ...state,
          ...template,
        }));
      },

      clearAllTests: () => set({ pressureTests: [] }),

      importSettings: (settings) => set((state) => ({ ...state, ...settings })),

      exportSettings: () => {
        const state = get();
        return {
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
        };
      },

      resetToDefaults: () => set(getDefaultSettings()),
    }),
    {
      name: 'pressure-test-settings',
    }
  )
);
