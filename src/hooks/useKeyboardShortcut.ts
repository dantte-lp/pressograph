import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  enabled?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts
 * @param options - Keyboard shortcut configuration
 * @example
 * useKeyboardShortcut({
 *   key: 'k',
 *   ctrl: true,
 *   callback: () => console.log('Ctrl+K pressed'),
 * });
 */
export const useKeyboardShortcut = ({
  key,
  ctrl = false,
  shift = false,
  alt = false,
  callback,
  enabled = true,
}: KeyboardShortcutOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlMatch = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const isShiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const isAltMatch = alt ? event.altKey : !event.altKey;

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        isCtrlMatch &&
        isShiftMatch &&
        isAltMatch
      ) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, ctrl, shift, alt, callback, enabled]);
};
