import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

/**
 * useFetch
 * Lightweight data fetching hook using the existing Axios instance.
 * Inherits interceptors, auth headers, and standardized error handling.
 *
 * For simple one-off fetches where React Query is overkill.
 *
 * @param {string} url - API endpoint (relative to base URL)
 * @param {Object} options
 * @param {boolean} options.immediate - Fetch on mount (default: true)
 * @param {Object} options.params - Query parameters
 * @param {any} options.initialData - Initial data value
 *
 * @returns {{ data: any, error: Error|null, isLoading: boolean, refetch: Function }}
 *
 * @example
 * const { data: user, isLoading, error } = useFetch('/users/me');
 *
 * @example
 * // With query params
 * const { data: items } = useFetch('/items', { params: { page: 1 } });
 *
 * @example
 * // Manual fetch
 * const { data, refetch } = useFetch('/data', { immediate: false });
 * <Button onClick={refetch}>Load Data</Button>
 */
export default function useFetch(url, options = {}) {
  const { immediate = true, params, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(immediate);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(url, { params });

      if (isMounted.current) {
        // Handle standardized API response shape
        if (response.data?.success) {
          setData(response.data.data);
        } else {
          setData(response.data);
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [url, params]);

  // Initial fetch
  useEffect(() => {
    if (immediate) {
      fetch();
    }
  }, [immediate, fetch]);

  return { data, error, isLoading, refetch: fetch };
}
