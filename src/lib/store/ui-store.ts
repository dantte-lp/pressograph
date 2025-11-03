/**
 * UI State Store
 *
 * Zustand store for managing client-side UI state
 * - Sidebar collapsed/expanded
 * - Active filters
 * - Table/grid view preferences
 * - Modal states
 * - Toast notifications
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * UI State Interface
 */
interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // View preferences
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  // Active filters
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;

  // Modal states
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // Loading states for UI operations
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;
}

/**
 * UI Store with middleware
 * - immer: Enables immutable state updates with mutable syntax
 * - persist: Saves UI preferences to Valkey/localStorage
 * - devtools: Redux DevTools integration
 */
export const useUIStore = create<UIState>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial state
        sidebarCollapsed: false,
        viewMode: 'grid',
        filters: {},
        activeModal: null,
        searchQuery: '',
        loadingStates: {},

        // Sidebar actions
        toggleSidebar: () =>
          set((state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
          }),

        setSidebarCollapsed: (collapsed) =>
          set((state) => {
            state.sidebarCollapsed = collapsed;
          }),

        // View mode actions
        setViewMode: (mode) =>
          set((state) => {
            state.viewMode = mode;
          }),

        // Filter actions
        setFilter: (key, value) =>
          set((state) => {
            state.filters[key] = value;
          }),

        clearFilter: (key) =>
          set((state) => {
            delete state.filters[key];
          }),

        clearAllFilters: () =>
          set((state) => {
            state.filters = {};
          }),

        // Modal actions
        openModal: (modalId) =>
          set((state) => {
            state.activeModal = modalId;
          }),

        closeModal: () =>
          set((state) => {
            state.activeModal = null;
          }),

        // Search actions
        setSearchQuery: (query) =>
          set((state) => {
            state.searchQuery = query;
          }),

        clearSearch: () =>
          set((state) => {
            state.searchQuery = '';
          }),

        // Loading state actions
        setLoading: (key, loading) =>
          set((state) => {
            state.loadingStates[key] = loading;
          }),
      })),
      {
        name: 'pressograph-ui-storage',
        // Only persist specific keys (not all UI state)
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          viewMode: state.viewMode,
        }),
      }
    ),
    {
      name: 'UIStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

/**
 * Selector hooks for optimized re-renders
 * Only subscribe to specific parts of the store
 */
export const useSidebarCollapsed = () =>
  useUIStore((state) => state.sidebarCollapsed);

export const useViewMode = () => useUIStore((state) => state.viewMode);

export const useFilters = () => useUIStore((state) => state.filters);

export const useActiveModal = () => useUIStore((state) => state.activeModal);

export const useSearchQuery = () => useUIStore((state) => state.searchQuery);

export const useLoadingState = (key: string) =>
  useUIStore((state) => state.loadingStates[key] ?? false);
