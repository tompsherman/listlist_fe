import { useEffect, useCallback } from 'react';

/**
 * useKeyPress
 * Listens for a specific keypress and fires a callback.
 * Escape to close modal, Enter to submit, arrow keys to navigate.
 *
 * @param {string|string[]} targetKey - Key or array of keys to listen for (e.g., 'Escape', 'Enter', ['ArrowUp', 'ArrowDown'])
 * @param {Function} handler - Callback fired when key is pressed. Receives the event.
 * @param {Object} options
 * @param {boolean} options.enabled - Whether listener is active (default: true)
 * @param {boolean} options.preventDefault - Prevent default behavior (default: false)
 * @param {boolean} options.stopPropagation - Stop event propagation (default: false)
 * @param {string} options.event - 'keydown' | 'keyup' (default: 'keydown')
 *
 * @example
 * // Close modal on Escape
 * useKeyPress('Escape', () => setIsOpen(false), { enabled: isOpen });
 *
 * @example
 * // Navigate list with arrow keys
 * useKeyPress(['ArrowUp', 'ArrowDown'], (e) => {
 *   if (e.key === 'ArrowUp') moveUp();
 *   if (e.key === 'ArrowDown') moveDown();
 * });
 *
 * @example
 * // Submit on Enter
 * useKeyPress('Enter', handleSubmit, { preventDefault: true });
 */
export default function useKeyPress(targetKey, handler, options = {}) {
  const {
    enabled = true,
    preventDefault = false,
    stopPropagation = false,
    event = 'keydown',
  } = options;

  const handleKeyPress = useCallback(
    (e) => {
      const keys = Array.isArray(targetKey) ? targetKey : [targetKey];

      if (keys.includes(e.key)) {
        if (preventDefault) e.preventDefault();
        if (stopPropagation) e.stopPropagation();
        handler(e);
      }
    },
    [targetKey, handler, preventDefault, stopPropagation]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener(event, handleKeyPress);
    return () => window.removeEventListener(event, handleKeyPress);
  }, [enabled, event, handleKeyPress]);
}
