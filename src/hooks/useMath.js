import { useState, useCallback, useRef } from 'react';

/**
 * useMath
 * Numeric state hook with arithmetic operations.
 * Embodies "local state as scratchpad, backend as ledger" pattern.
 *
 * Value accumulates in state through operations. Call commit() to
 * send the final value to the backend. This keeps API calls intentional
 * and enables undo without backend involvement.
 *
 * @param {number} initialValue - Starting value (default: 0)
 * @param {Object} options
 * @param {number} options.min - Minimum allowed value (default: -Infinity)
 * @param {number} options.max - Maximum allowed value (default: Infinity)
 * @param {number} options.precision - Decimal places to round to (default: null = no rounding)
 * @param {Function} options.onCommit - Callback when commit() is called with final value
 *
 * @returns {Object}
 *
 * @example
 * const { value, add, subtract, reset, commit } = useMath(0, {
 *   min: 0,
 *   max: 100,
 *   onCommit: (finalValue) => api.updateQuantity(finalValue)
 * });
 *
 * // User clicks buttons, value builds up in state
 * add(5);      // value: 5
 * add(3);      // value: 8
 * subtract(2); // value: 6
 *
 * // When ready, commit sends to backend
 * commit(); // fires onCommit(6)
 */
export default function useMath(initialValue = 0, options = {}) {
  const {
    min = -Infinity,
    max = Infinity,
    precision = null,
    onCommit,
  } = options;

  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // Clamp and round helper
  const normalize = useCallback(
    (n) => {
      let result = Math.max(min, Math.min(max, n));
      if (precision !== null) {
        const factor = Math.pow(10, precision);
        result = Math.round(result * factor) / factor;
      }
      return result;
    },
    [min, max, precision]
  );

  const [value, setValueRaw] = useState(() => normalize(initialValue));

  // Internal setter that always normalizes
  const setValue = useCallback(
    (newValue) => {
      setValueRaw((prev) => {
        const val = typeof newValue === 'function' ? newValue(prev) : newValue;
        return normalize(val);
      });
    },
    [normalize]
  );

  // Arithmetic operations
  const add = useCallback(
    (n = 1) => setValue((v) => v + n),
    [setValue]
  );

  const subtract = useCallback(
    (n = 1) => setValue((v) => v - n),
    [setValue]
  );

  const multiply = useCallback(
    (n) => setValue((v) => v * n),
    [setValue]
  );

  const divide = useCallback(
    (n) => {
      if (n === 0) return; // Prevent division by zero
      setValue((v) => v / n);
    },
    [setValue]
  );

  // Percentage: add or subtract a percentage of current value
  const percentage = useCallback(
    (percent, mode = 'add') => {
      setValue((v) => {
        const delta = v * (percent / 100);
        return mode === 'add' ? v + delta : v - delta;
      });
    },
    [setValue]
  );

  // Reset to initial value
  const reset = useCallback(() => {
    setValueRaw(normalize(initialValue));
  }, [initialValue, normalize]);

  // Commit: send current value to backend via callback
  const commit = useCallback(() => {
    return onCommitRef.current?.(value);
  }, [value]);

  // Increment/decrement by step (aliases for CountUpDown compatibility)
  const increment = useCallback(
    (step = 1) => add(step),
    [add]
  );

  const decrement = useCallback(
    (step = 1) => subtract(step),
    [subtract]
  );

  return {
    value,
    setValue,
    add,
    subtract,
    multiply,
    divide,
    percentage,
    reset,
    commit,
    // Aliases for compatibility
    increment,
    decrement,
  };
}
