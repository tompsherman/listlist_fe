import { useState, useCallback, useRef } from 'react';

/**
 * useOptimistic
 * Optimistic UI updates with automatic rollback on failure.
 * Update UI immediately, fire API in background, rollback if it fails.
 *
 * Note: React 19 has this built-in. This is a React 18 polyfill.
 *
 * @param {any} initialValue - Current server value
 * @param {Function} updateFn - Async function that performs the actual update
 *
 * @returns {[any, Function, boolean]}
 *   - value: current optimistic value
 *   - update: function to trigger optimistic update
 *   - isPending: whether an update is in flight
 *
 * @example
 * const [likes, setLikes, isPending] = useOptimistic(
 *   post.likes,
 *   async (newLikes) => {
 *     await api.updateLikes(postId, newLikes);
 *   }
 * );
 *
 * const handleLike = () => {
 *   setLikes(likes + 1); // UI updates immediately
 *   // If API fails, automatically rolls back
 * };
 */
export default function useOptimistic(initialValue, updateFn) {
  const [value, setValue] = useState(initialValue);
  const [isPending, setIsPending] = useState(false);
  const previousValue = useRef(initialValue);

  // Sync with server value when it changes
  // (e.g., after a successful update or refetch)
  if (initialValue !== previousValue.current && !isPending) {
    previousValue.current = initialValue;
    setValue(initialValue);
  }

  const update = useCallback(
    async (optimisticValue) => {
      // Store current value for potential rollback
      const rollbackValue = value;
      previousValue.current = value;

      // Optimistically update UI
      setValue(optimisticValue);
      setIsPending(true);

      try {
        // Perform actual update
        await updateFn(optimisticValue);
        // Success - keep optimistic value, update reference
        previousValue.current = optimisticValue;
      } catch (error) {
        // Failure - rollback to previous value
        setValue(rollbackValue);
        previousValue.current = rollbackValue;
        throw error; // Re-throw so caller can handle
      } finally {
        setIsPending(false);
      }
    },
    [value, updateFn]
  );

  return [value, update, isPending];
}
