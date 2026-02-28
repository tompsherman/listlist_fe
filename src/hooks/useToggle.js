import { useState, useCallback } from 'react';

/**
 * useToggle
 * Boolean state with toggle, setTrue, and setFalse helpers.
 * Replaces the [value, setValue] pattern you'd write for every boolean.
 *
 * @param {boolean} initial - Initial value (default: false)
 * @returns {[boolean, { toggle, setTrue, setFalse, setValue }]}
 *
 * @example
 * const [isOpen, { toggle, setTrue, setFalse }] = useToggle(false);
 *
 * <button onClick={toggle}>Toggle</button>
 * <button onClick={setTrue}>Open</button>
 * <button onClick={setFalse}>Close</button>
 */
export default function useToggle(initial = false) {
  const [value, setValue] = useState(initial);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, { toggle, setTrue, setFalse, setValue }];
}
