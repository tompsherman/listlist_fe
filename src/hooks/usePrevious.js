import { useRef, useEffect } from 'react';

/**
 * usePrevious
 * Tracks the previous value of any state variable.
 * Useful for animations, comparisons, and detecting changes.
 *
 * @param {any} value - The value to track
 * @returns {any} - The previous value (undefined on first render)
 *
 * @example
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 *
 * // On render where count changes from 5 to 6:
 * // count = 6, prevCount = 5
 *
 * @example
 * // Detect direction of change
 * const direction = count > prevCount ? 'up' : 'down';
 */
export default function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
