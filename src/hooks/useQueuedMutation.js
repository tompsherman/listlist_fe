/**
 * useQueuedMutation Hook
 * 
 * Queues API mutations (POST/PATCH/DELETE) when backend is initializing.
 * Executes immediately when backend is ready.
 * Handles conflict resolution on flush.
 * 
 * Usage:
 *   const { mutate, isPending } = useQueuedMutation({
 *     mutationFn: async (payload) => await api.addItem(payload),
 *     onOptimistic: (payload) => applyChange('add', payload),
 *     conflictCheck: (payload, freshData) => {
 *       // Return true if conflict (skip this mutation)
 *       return freshData.some(item => item.name === payload.name);
 *     },
 *     onSuccess: (result) => console.log('Done:', result),
 *     onError: (err) => console.error('Failed:', err),
 *   });
 * 
 *   // In handler:
 *   mutate({ name: 'Green Beans', quantity: 1 });
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { getIsInitializing, onInitChange } from './useCachedData';

// Global mutation queue
const mutationQueue = [];
const queueListeners = new Set();

function notifyQueueChange() {
  queueListeners.forEach(cb => cb(mutationQueue.length));
}

export function getQueueLength() {
  return mutationQueue.length;
}

export function onQueueChange(callback) {
  queueListeners.add(callback);
  return () => queueListeners.delete(callback);
}

// Process queue when backend becomes ready
let flushInProgress = false;

async function flushQueue(getFreshData) {
  if (flushInProgress || mutationQueue.length === 0) return;
  
  flushInProgress = true;
  console.log('[useQueuedMutation] Flushing queue:', mutationQueue.length, 'mutations');
  
  // Get fresh data for conflict checks
  const freshData = getFreshData ? getFreshData() : null;
  
  // Process queue in order
  while (mutationQueue.length > 0) {
    const mutation = mutationQueue.shift();
    notifyQueueChange();
    
    try {
      // Check for conflicts
      if (mutation.conflictCheck && freshData) {
        const hasConflict = mutation.conflictCheck(mutation.payload, freshData);
        if (hasConflict) {
          console.log('[useQueuedMutation] Skipping conflicted mutation:', mutation.payload);
          // Call onConflict if provided
          if (mutation.onConflict) {
            mutation.onConflict(mutation.payload, freshData);
          }
          continue;
        }
      }
      
      // Execute mutation
      const result = await mutation.mutationFn(mutation.payload);
      
      if (mutation.onSuccess) {
        mutation.onSuccess(result);
      }
    } catch (err) {
      console.error('[useQueuedMutation] Mutation failed:', err);
      if (mutation.onError) {
        mutation.onError(err);
      }
    }
  }
  
  flushInProgress = false;
}

// Hook to register flush trigger
let flushRegistered = false;
let getFreshDataFn = null;

function registerFlushTrigger() {
  if (flushRegistered) return;
  flushRegistered = true;
  
  onInitChange((isInit) => {
    if (!isInit) {
      // Backend is ready - flush queue
      flushQueue(getFreshDataFn);
    }
  });
}

/**
 * Main hook
 */
export function useQueuedMutation({
  mutationFn,
  onOptimistic,
  conflictCheck,
  onSuccess,
  onError,
  onConflict,
  getFreshData,
}) {
  const [isPending, setIsPending] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const mountedRef = useRef(true);
  
  // Register fresh data getter for conflict checks
  useEffect(() => {
    if (getFreshData) {
      getFreshDataFn = getFreshData;
    }
  }, [getFreshData]);
  
  // Register flush trigger once
  useEffect(() => {
    registerFlushTrigger();
  }, []);
  
  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  
  const mutate = useCallback(async (payload) => {
    const isInitializing = getIsInitializing();
    
    // Always apply optimistic update immediately
    if (onOptimistic) {
      onOptimistic(payload);
    }
    
    if (isInitializing) {
      // Queue the mutation for later
      console.log('[useQueuedMutation] Queuing mutation (backend initializing):', payload);
      
      mutationQueue.push({
        payload,
        mutationFn,
        conflictCheck,
        onSuccess: (result) => {
          if (mountedRef.current) setIsQueued(false);
          if (onSuccess) onSuccess(result);
        },
        onError: (err) => {
          if (mountedRef.current) setIsQueued(false);
          if (onError) onError(err);
        },
        onConflict,
      });
      
      notifyQueueChange();
      setIsQueued(true);
      return;
    }
    
    // Execute immediately
    setIsPending(true);
    
    try {
      const result = await mutationFn(payload);
      
      if (mountedRef.current) {
        setIsPending(false);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      console.error('[useQueuedMutation] Mutation error:', err);
      
      if (mountedRef.current) {
        setIsPending(false);
      }
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    }
  }, [mutationFn, onOptimistic, conflictCheck, onSuccess, onError, onConflict]);
  
  return {
    mutate,
    isPending,
    isQueued,
    queueLength: mutationQueue.length,
  };
}

export default useQueuedMutation;
