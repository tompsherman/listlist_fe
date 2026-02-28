import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useUndoRedo
 * Undo/redo stack for any value. Enables Ctrl+Z / Ctrl+Y behavior.
 *
 * @param {any} initialValue - Starting value
 * @param {Object} options
 * @param {number} options.maxHistory - Max undo steps (default: 100)
 * @param {boolean} options.bindKeys - Bind Ctrl+Z/Y automatically (default: true)
 *
 * @returns {{
 *   value: any,
 *   setValue: (newValue: any | (prev: any) => any) => void,
 *   undo: () => void,
 *   redo: () => void,
 *   canUndo: boolean,
 *   canRedo: boolean,
 *   history: any[],
 *   historyIndex: number,
 *   clear: () => void,
 * }}
 *
 * @example
 * // Blog composer with undo/redo
 * const { value, setValue, undo, redo, canUndo, canRedo } = useUndoRedo('');
 *
 * <textarea value={value} onChange={(e) => setValue(e.target.value)} />
 * <button onClick={undo} disabled={!canUndo}>Undo</button>
 * <button onClick={redo} disabled={!canRedo}>Redo</button>
 *
 * @example
 * // Drag and drop with undo
 * const { value: items, setValue: setItems, undo } = useUndoRedo(initialItems);
 *
 * const handleDragEnd = (newOrder) => {
 *   setItems(newOrder); // User can Ctrl+Z to restore previous order
 * };
 */
export default function useUndoRedo(initialValue, options = {}) {
  const { maxHistory = 100, bindKeys = true } = options;

  // History stack: array of past values
  // Index points to current value in history
  const [history, setHistory] = useState([initialValue]);
  const [index, setIndex] = useState(0);

  // Track if we're programmatically changing (to avoid double-push)
  const isUndoRedo = useRef(false);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;
  const value = history[index];

  // Set new value (pushes to history)
  const setValue = useCallback(
    (newValue) => {
      if (isUndoRedo.current) {
        isUndoRedo.current = false;
        return;
      }

      setHistory((prev) => {
        const resolvedValue =
          typeof newValue === 'function' ? newValue(prev[index]) : newValue;

        // If value hasn't changed, don't push
        if (resolvedValue === prev[index]) return prev;

        // Slice off any redo history
        const newHistory = prev.slice(0, index + 1);
        newHistory.push(resolvedValue);

        // Enforce max history limit
        if (newHistory.length > maxHistory) {
          newHistory.shift();
          return newHistory;
        }

        return newHistory;
      });

      setIndex((prev) => {
        const newIndex = prev + 1;
        return newIndex >= maxHistory ? maxHistory - 1 : newIndex;
      });
    },
    [index, maxHistory]
  );

  // Undo: move back in history
  const undo = useCallback(() => {
    if (!canUndo) return;
    isUndoRedo.current = true;
    setIndex((prev) => prev - 1);
  }, [canUndo]);

  // Redo: move forward in history
  const redo = useCallback(() => {
    if (!canRedo) return;
    isUndoRedo.current = true;
    setIndex((prev) => prev + 1);
  }, [canRedo]);

  // Clear history and reset to current value
  const clear = useCallback(() => {
    setHistory([value]);
    setIndex(0);
  }, [value]);

  // Keyboard bindings (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    if (!bindKeys) return;

    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bindKeys, undo, redo]);

  return {
    value,
    setValue,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
    historyIndex: index,
    clear,
  };
}
