import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * usePolling
 * Repeatedly calls a function on an interval.
 * For live scores, order status, job queue progress.
 *
 * @param {Function} fetchFn - Async function to call on each interval
 * @param {number|null} interval - Interval in ms, or null to pause
 * @param {Object} options
 * @param {boolean} options.immediate - Call immediately on mount (default: true)
 * @param {Function} options.onError - Error handler
 *
 * @returns {{ data: any, error: Error|null, isLoading: boolean, refetch: Function }}
 *
 * @example
 * const { data: status, isLoading } = usePolling(
 *   () => api.getOrderStatus(orderId),
 *   5000 // Poll every 5 seconds
 * );
 *
 * @example
 * // Conditional polling - pause when complete
 * const interval = status === 'completed' ? null : 5000;
 * const { data } = usePolling(() => api.getStatus(), interval);
 */
export default function usePolling(fetchFn, interval, options = {}) {
  const { immediate = true, onError } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFnRef = useRef(fetchFn);
  const onErrorRef = useRef(onError);

  // Keep refs current
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    onErrorRef.current = onError;
  }, [fetchFn, onError]);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFnRef.current();
      setData(result);
    } catch (err) {
      setError(err);
      onErrorRef.current?.(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (immediate) {
      fetch();
    }
  }, [immediate, fetch]);

  // Polling interval
  useEffect(() => {
    if (interval === null) return;

    const id = setInterval(fetch, interval);
    return () => clearInterval(id);
  }, [interval, fetch]);

  return { data, error, isLoading, refetch: fetch };
}
