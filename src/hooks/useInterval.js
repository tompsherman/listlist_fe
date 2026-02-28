import { useEffect, useRef } from 'react';

/**
 * useInterval
 * A safe setInterval wrapper that handles cleanup correctly.
 * The callback can change between renders without resetting the interval.
 * Pass null as delay to pause.
 *
 * @param {Function} callback - Function to call on each interval
 * @param {number|null} delay - Interval in ms, or null to pause
 *
 * @example
 * // Basic interval
 * useInterval(() => {
 *   setCount(c => c + 1);
 * }, 1000);
 *
 * @example
 * // Pausable interval
 * const [isRunning, setIsRunning] = useState(true);
 * useInterval(() => tick(), isRunning ? 1000 : null);
 *
 * @example
 * // Dynamic interval
 * const [speed, setSpeed] = useState(1000);
 * useInterval(() => move(), speed);
 */
export default function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    // Don't schedule if delay is null (paused)
    if (delay === null) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);

    return () => clearInterval(id);
  }, [delay]);
}
