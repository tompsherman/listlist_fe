import { useState, useCallback } from 'react';

/**
 * useErrorBoundary
 * A hook version of error boundaries for functional components.
 * Allows programmatic error throwing that gets caught by nearest ErrorBoundary.
 *
 * @returns {{ error: Error|null, throwError: Function, resetError: Function }}
 *
 * @example
 * const { throwError, resetError } = useErrorBoundary();
 *
 * const handleClick = async () => {
 *   try {
 *     await riskyOperation();
 *   } catch (err) {
 *     throwError(err); // Triggers nearest ErrorBoundary
 *   }
 * };
 *
 * @example
 * // With error state
 * const { error, throwError, resetError } = useErrorBoundary();
 *
 * if (error) {
 *   return <ErrorState error={error} onRetry={resetError} />;
 * }
 */
export default function useErrorBoundary() {
  const [error, setError] = useState(null);

  const throwError = useCallback((err) => {
    setError(err);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // If there's an error, throw it to be caught by ErrorBoundary
  // This is the key trick - throwing during render triggers ErrorBoundary
  if (error) {
    throw error;
  }

  return { error, throwError, resetError };
}

/**
 * useErrorHandler
 * Simpler version that just returns a function to throw errors.
 * Use when you don't need to reset.
 *
 * @returns {Function} - throwError function
 *
 * @example
 * const throwError = useErrorHandler();
 *
 * useEffect(() => {
 *   fetch('/api/data')
 *     .catch(throwError); // Triggers ErrorBoundary
 * }, []);
 */
export function useErrorHandler() {
  const [error, setError] = useState(null);

  if (error) {
    throw error;
  }

  return setError;
}
